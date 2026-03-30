const cloud = require('wx-server-sdk')

cloud.init()

async function safeGetList(db, collectionName, query = {}, orderByField = 'updateTime', order = 'desc', limit = 50) {
  try {
    return await db.collection(collectionName).where(query).orderBy(orderByField, order).limit(limit).get()
  } catch (error) {
    return { data: [] }
  }
}

function buildTagList(contacts) {
  const tagSet = new Set(['All'])
  contacts.forEach((contact) => {
    ;(contact.tags || []).forEach((tag) => tagSet.add(tag))
  })
  return Array.from(tagSet)
}

exports.main = async () => {
  const db = cloud.database()
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const contactResult = await safeGetList(db, 'contacts', { ownerOpenid: openid }, 'updateTime', 'desc', 100)
    const contacts = contactResult.data || []
    const pendingRequests = contacts.filter((item) => item.status === 'pending')
    const activeContacts = contacts.filter((item) => item.status !== 'pending' && item.status !== 'rejected')
    const starredContacts = activeContacts.filter((item) => item.starred)
    const updatedTips = activeContacts.filter((item) => item.hasUpdate)

    return {
      success: true,
      pendingRequests,
      contacts: activeContacts,
      starredContacts,
      updatedTips,
      tags: buildTagList(activeContacts)
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      pendingRequests: [],
      contacts: [],
      starredContacts: [],
      updatedTips: [],
      tags: ['All']
    }
  }
}