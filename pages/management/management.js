// management.js
Page({
  onLoad() {},

  goToQRCode() {
    wx.navigateTo({ url: '/pages/qrcode/qrcode' })
  },

  goToMember() {
    wx.navigateTo({ url: '/pages/member/member' })
  }
})
