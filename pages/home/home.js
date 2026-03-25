// home.js
Page({
  data: {
    currentIndex: 0,
    timeRange: 'day',
    cardCount: 3,
    maxValue: 100,
    chartData: [
      { label: '周一', value: 45, height: 45 },
      { label: '周二', value: 78, height: 78 },
      { label: '周三', value: 32, height: 32 },
      { label: '周四', value: 95, height: 95 },
      { label: '周五', value: 67, height: 67 },
      { label: '周六', value: 23, height: 23 },
      { label: '周日', value: 18, height: 18 }
    ]
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync()
    const cardWidth = systemInfo.windowWidth - 48
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
    const range = e.currentTarget.dataset.range
    let chartData = []
    let maxValue = 100
    
    if (range === 'day') {
      chartData = [
        { label: '8时', value: 12, height: 12 },
        { label: '10时', value: 28, height: 28 },
        { label: '12时', value: 45, height: 45 },
        { label: '14时', value: 68, height: 68 },
        { label: '16时', value: 52, height: 52 },
        { label: '18时', value: 35, height: 35 },
        { label: '20时', value: 18, height: 18 }
      ]
      maxValue = 100
    } else if (range === 'week') {
      chartData = [
        { label: '周一', value: 45, height: 45 },
        { label: '周二', value: 78, height: 78 },
        { label: '周三', value: 32, height: 32 },
        { label: '周四', value: 95, height: 95 },
        { label: '周五', value: 67, height: 67 },
        { label: '周六', value: 23, height: 23 },
        { label: '周日', value: 18, height: 18 }
      ]
      maxValue = 100
    } else if (range === 'month') {
      chartData = [
        { label: '第1周', value: 320, height: 80 },
        { label: '第2周', value: 280, height: 70 },
        { label: '第3周', value: 400, height: 100 },
        { label: '第4周', value: 350, height: 87 }
      ]
      maxValue = 400
    }
    
    this.setData({ 
      timeRange: range,
      chartData,
      maxValue
    })
  },

  setAsDefault(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ currentIndex: index })
    wx.showToast({ title: '已设为默认', icon: 'success' })
  },

  showQR() {
    wx.navigateTo({ url: '/pages/qrcode/qrcode' })
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
