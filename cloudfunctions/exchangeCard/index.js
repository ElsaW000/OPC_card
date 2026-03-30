const cloud = require('wx-server-sdk')

cloud.init()

async function upsertContact(db, payload, query) {
  const contactCollection = db.collection('contacts')
  const existing = await contactCollection.where(query).limit(1).get()

  if (existing.data.length > 0) {
    await contactCollection.doc(existing.data[0]._id).update({
      data: {
        ...payload,
        updateTime: db.serverDate()
      }
    })
    return existing.data[0]._id
  }

  const result = await contactCollection.add({
    data: {
      ...payload,
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
  })
  return result._id
}

exports.main = async (event) => {
  const db = cloud.database()
  const wxContext = cloud.getWXContext()
  const requesterOpenid = wxContext.OPENID
  const { targetCardId } = event

  try {
    const cardCollection = db.collection('cards')
    const targetCard = await cardCollection.doc(targetCardId).get()

    if (!targetCard.data) {
      return { success: false, error: '目标名片不存在' }
    }

    if (targetCard.data._openid === requesterOpenid) {
      return { success: false, error: '不能和自己交换名片' }
    }

    const requesterCards = await cardCollection.where({
      _openid: requesterOpenid
    }).get()
    const requesterCard = requesterCards.data.find((item) => item.isDefault) || requesterCards.data[0]

    if (!requesterCard) {
      return { success: false, error: '请先创建自己的名片' }
    }

    await upsertContact(db, {
      ownerOpenid: requesterOpenid,
      contactOpenid: targetCard.data._openid,
      cardId: targetCard.data._id,
      status: 'pending_sent',
      starred: false,
      hasUpdate: false,
      name: targetCard.data.name,
      role: targetCard.data.role,
      company: targetCard.data.company || '',
      phone: targetCard.data.phone || '',
      email: targetCard.data.email || '',
      wechat: targetCard.data.wechat || '',
      avatar: targetCard.data.avatarUrl || '',
      avatarUrl: targetCard.data.avatarUrl || '',
      bannerUrl: targetCard.data.bannerUrl || '',
      locationCountry: targetCard.data.locationCountry || '',
      locationCity: targetCard.data.locationCity || '',
      bio: targetCard.data.bio || '',
      tags: targetCard.data.customCards ? targetCard.data.customCards.map((item) => item.title).filter(Boolean).slice(0, 3) : [],
      latestInteractionText: '已发送交换请求'
    }, {
      ownerOpenid: requesterOpenid,
      contactOpenid: targetCard.data._openid
    })

    await upsertContact(db, {
      ownerOpenid: targetCard.data._openid,
      contactOpenid: requesterOpenid,
      cardId: requesterCard._id,
      status: 'pending',
      starred: false,
      hasUpdate: false,
      name: requesterCard.name,
      role: requesterCard.role,
      company: requesterCard.company || '',
      phone: requesterCard.phone || '',
      email: requesterCard.email || '',
      wechat: requesterCard.wechat || '',
      avatar: requesterCard.avatarUrl || '',
      avatarUrl: requesterCard.avatarUrl || '',
      bannerUrl: requesterCard.bannerUrl || '',
      locationCountry: requesterCard.locationCountry || '',
      locationCity: requesterCard.locationCity || '',
      bio: requesterCard.bio || '',
      tags: requesterCard.customCards ? requesterCard.customCards.map((item) => item.title).filter(Boolean).slice(0, 3) : [],
      latestInteractionText: '刚刚发起交换请求'
    }, {
      ownerOpenid: targetCard.data._openid,
      contactOpenid: requesterOpenid
    })

    try {
      await db.collection('exchange_records').add({
        data: {
          requesterOpenid,
          targetOpenid: targetCard.data._openid,
          requesterCardId: requesterCard._id,
          targetCardId: targetCard.data._id,
          status: 'pending',
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
    } catch (error) {}

    return {
      success: true
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}