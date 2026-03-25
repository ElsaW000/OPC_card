// home.js
Page({
  onLoad() {},

  goToMyCards() {
    wx.switchTab({ url: '/pages/mycards/mycards' })
  },

  goToVisitor() {
    wx.navigateTo({ url: '/pages/visitor/visitor' })
  },

  goToContacts() {
    wx.switchTab({ url: '/pages/contacts/contacts' })
  },

  goToAnalytics() {
    wx.navigateTo({ url: '/pages/analytics/analytics' })
  },

  goToMember() {
    wx.navigateTo({ url: '/pages/member/member' })
  },

  goToAI() {
    wx.navigateTo({ url: '/pages/aiFeatures/aiFeatures' })
  }
})
