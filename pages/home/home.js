// home.js
Page({
  data: {
    currentIndex: 0,
    timeRange: 'day',
    cardWidth: 600,
    cardGap: 20
  },

  onLoad() {
    const cardWidth = 600
    const cardGap = 20
    this.setData({ cardWidth, cardGap })
  },

  onScroll(e) {
    const scrollLeft = e.detail.scrollLeft
    const cardWidth = this.data.cardWidth
    const cardGap = this.data.cardGap
    const totalWidth = cardWidth + cardGap
    const currentIndex = Math.round(scrollLeft / totalWidth)
    if (currentIndex !== this.data.currentIndex) {
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
