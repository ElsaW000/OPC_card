const cloud = require('wx-server-sdk')

cloud.init()

async function safeGetList(db, collectionName, query = {}, orderByField = 'updateTime', order = 'desc', limit = 20) {
  try {
    return await db.collection(collectionName).where(query).orderBy(orderByField, order).limit(limit).get()
  } catch (error) {
    return { data: [] }
  }
}

function buildTrendRows(visitors) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const counts = {}
  days.forEach((day) => { counts[day] = 0 })

  visitors.forEach((visitor) => {
    const date = visitor.visitDate ? new Date(visitor.visitDate) : null
    if (!date || Number.isNaN(date.getTime())) {
      return
    }
    const key = days[(date.getDay() + 6) % 7]
    counts[key] += 1
  })

  const maxValue = Math.max(1, ...Object.values(counts))
  return {
    maxValue,
    chartData: days.map((day) => ({
      label: day,
      value: counts[day],
      height: Math.max(12, Math.round((counts[day] / maxValue) * 100))
    }))
  }
}

exports.main = async () => {
  const db = cloud.database()
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const cardsResult = await safeGetList(db, 'cards', { _openid: openid }, 'updateTime', 'desc', 10)
    const contactsResult = await safeGetList(db, 'contacts', { ownerOpenid: openid }, 'updateTime', 'desc', 20)
    const visitorsResult = await safeGetList(db, 'visitors', { ownerOpenid: openid }, 'visitDate', 'desc', 50)

    const cards = cardsResult.data || []
    const contacts = (contactsResult.data || []).filter((item) => item.status !== 'pending' && item.status !== 'rejected')
    const starredContacts = contacts.filter((item) => item.starred).slice(0, 4)
    const recentVisitors = (visitorsResult.data || []).slice(0, 3)
    const { maxValue, chartData } = buildTrendRows(visitorsResult.data || [])

    return {
      success: true,
      cards,
      defaultCard: cards.find((item) => item.isDefault) || cards[0] || null,
      visitorTotal: (visitorsResult.data || []).length,
      contactsTotal: contacts.length,
      starredContacts,
      recentVisitors,
      maxValue,
      chartData,
      aiSuggestions: [
        '优先跟进最近访问你名片的访客。',
        '把常用联系人设为星标，方便快速联系。'
      ]
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      cards: [],
      defaultCard: null,
      visitorTotal: 0,
      contactsTotal: 0,
      starredContacts: [],
      recentVisitors: [],
      maxValue: 1,
      chartData: [
        { label: 'Mon', value: 0, height: 12 },
        { label: 'Tue', value: 0, height: 12 },
        { label: 'Wed', value: 0, height: 12 },
        { label: 'Thu', value: 0, height: 12 },
        { label: 'Fri', value: 0, height: 12 },
        { label: 'Sat', value: 0, height: 12 },
        { label: 'Sun', value: 0, height: 12 }
      ],
      aiSuggestions: []
    }
  }
}