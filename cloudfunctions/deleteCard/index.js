// cloud function - deleteCard
const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const db = cloud.database()

  try {
    const { cardId } = event

    // 删除名片
    await db.collection('cards').doc(cardId).remove()

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
