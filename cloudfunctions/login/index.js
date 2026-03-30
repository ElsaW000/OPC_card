const cloud = require('wx-server-sdk')

cloud.init()

exports.main = async () => {
  const db = cloud.database()
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const appid = wxContext.APPID
  const unionid = wxContext.UNIONID || ''

  try {
    const userCollection = db.collection('users')
    const existing = await userCollection.where({
      _openid: openid
    }).limit(1).get()

    if (existing.data.length > 0) {
      const user = existing.data[0]
      await userCollection.doc(user._id).update({
        data: {
          lastLoginTime: db.serverDate(),
          appid,
          unionid
        }
      })

      return {
        success: true,
        openid,
        appid,
        unionid,
        userId: user._id,
        isNewUser: false
      }
    }

    const result = await userCollection.add({
      data: {
        _openid: openid,
        appid,
        unionid,
        profile: {},
        createTime: db.serverDate(),
        lastLoginTime: db.serverDate()
      }
    })

    return {
      success: true,
      openid,
      appid,
      unionid,
      userId: result._id,
      isNewUser: true
    }
  } catch (error) {
    return {
      success: false,
      openid,
      appid,
      unionid,
      error: error.message
    }
  }
}
