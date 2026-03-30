const cloud = require('wx-server-sdk')

cloud.init()

exports.main = async () => {
  const db = cloud.database()
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const result = await db.collection('visitors').where({
      ownerOpenid: openid
    }).orderBy('visitDate', 'desc').limit(100).get()

    return {
      success: true,
      visitors: result.data || []
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      visitors: []
    }
  }
}