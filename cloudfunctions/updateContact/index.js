const cloud = require('wx-server-sdk')

cloud.init()

async function syncPeerStatus(contactCollection, db, contact, nextStatus, latestInteractionText) {
  const peerResult = await contactCollection.where({
    ownerOpenid: contact.contactOpenid,
    contactOpenid: contact.ownerOpenid
  }).limit(1).get()

  if (peerResult.data.length === 0) {
    return
  }

  await contactCollection.doc(peerResult.data[0]._id).update({
    data: {
      status: nextStatus,
      latestInteractionText,
      updateTime: db.serverDate()
    }
  })
}

exports.main = async (event) => {
  const db = cloud.database()
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { contactId, action, note = '' } = event

  try {
    const contactCollection = db.collection('contacts')
    const contact = await contactCollection.doc(contactId).get()

    if (!contact.data || contact.data.ownerOpenid !== openid) {
      return {
        success: false,
        error: '无权操作该联系人'
      }
    }

    if (action === 'toggleStar') {
      await contactCollection.doc(contactId).update({
        data: {
          starred: !contact.data.starred,
          updateTime: db.serverDate()
        }
      })
    }

    if (action === 'approveRequest') {
      await contactCollection.doc(contactId).update({
        data: {
          status: 'active',
          latestInteractionText: '已通过交换请求',
          updateTime: db.serverDate()
        }
      })

      await syncPeerStatus(contactCollection, db, contact.data, 'active', '对方已通过你的交换请求')
    }

    if (action === 'rejectRequest') {
      await contactCollection.doc(contactId).update({
        data: {
          status: 'rejected',
          latestInteractionText: '已拒绝交换请求',
          updateTime: db.serverDate()
        }
      })

      await syncPeerStatus(contactCollection, db, contact.data, 'rejected', '对方暂未接受交换请求')
    }

    if (action === 'saveNote') {
      await contactCollection.doc(contactId).update({
        data: {
          note,
          updateTime: db.serverDate()
        }
      })
    }

    return {
      success: true
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}