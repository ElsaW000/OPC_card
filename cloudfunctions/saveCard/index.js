// cloud function - saveCard
const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const db = cloud.database()
  const _ = db.command
  const wxContext = cloud.getWXContext()

  // 接收传入的卡片数据
  const cardData = event.cardData

  try {
    const userInfo = wxContext.OPENID
    
    // 检查是否已存在名片
    const cards = await db.collection('cards').where({
      _openid: userInfo
    }).get()

    if (cards.data.length > 0) {
      // 更新已有名片
      const cardId = cards.data[0]._id
      await db.collection('cards').doc(cardId).update({
        data: {
          ...cardData,
          updateTime: db.serverDate()
        }
      })
      
      return {
        success: true,
        message: '名片更新成功',
        cardId: cardId
      }
    } else {
      // 创建新名片
      const newCard = {
        ...cardData,
        _openid: userInfo,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
      
      const result = await db.collection('cards').add({
        data: newCard
      })
      
      return {
        success: true,
        message: '名片创建成功',
        cardId: result._id
      }
    }
  } catch (e) {
    return {
      success: false,
      error: e.message
    }
  }
}
