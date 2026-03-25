// home.js
Page({
  data: {
    currentIndex: 0,
    timeRange: 'day',
    cardCount: 3
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync()
    const cardWidth = systemInfo.windowWidth - 48 // 24rpx * 2 padding
    this.setData({ cardWidth })
  },

  onScroll(e) {
    const scrollLeft = e.detail.scrollLeft
    const cardWidth = this.data.cardWidth || (wx.getSystemInfoSync().windowWidth - 48)
    const cardGap = 20
    const totalWidth = cardWidth + cardGap
    const currentIndex = Math.round(scrollLeft / totalWidth)
    if (currentIndex !== this.data.currentIndex && currentIndex >= 0 && currentIndex < this.data.cardCount) {
      this.setData({ currentIndex })
    }
  },

  setTimeRange(e) {
    this.setData({ timeRange: e.currentTarget.dataset.range })
  },

  editCard() {
    wx.navigateTo({ url: '/pages/edit/edit' })
  },

  shareCard() {
    wx.showShareMenu({ withShareTicket: true })
  },

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
  }
})
