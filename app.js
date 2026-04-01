// app.js
App({
  onLaunch (options) {
    // 初始化云开发
    if (wx.cloud) {
      wx.cloud.init({
        env: 'your-cloud-env-id', // 替换为你的云开发环境ID
        traceUser: true
      })
    }
  },
  onShow (options) {
    // Do something when show.
  },
  onHide () {
    // Do something when hide.
  },
  onError (msg) {
    // 避免在框架销毁期间调用 console 导致 __global 循环报错
    try { console.error('[App Error]', msg) } catch (e) {}
  },
  globalData: {
    cardData: null,
    cloudDB: null
  }
})
