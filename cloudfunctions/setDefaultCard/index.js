// cloud function - setDefaultCard
const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const db = cloud.database()
  const wxContext = cloud.getWXContext()

  try {
    const userInfo = wxContext.OPENID
    const { cardId } = event

    // 先把当前用户的所有名片的 isDefault 设为 false
    await db.collection('cards').where({
      _openid: userInfo
    }).update({
      data: {
        isDefault: false
      }
    })

    // 再把指定名片设为默认
    await db.collection('cards').doc(cardId).update({
      data: {
        isDefault: true
      }
    })

    return {
      success: true
    }
  } catch (e) {
    return {
      success: false,
      error: e.message
    }
  }
}
