// home.js - 工作台

const app = getApp()

Page({
  data: {
    currentCard: {
      name: '陈小独立',
      role: 'Full-stack Developer',
      locationCountry: '中国',
      locationCity: '深圳',
      avatarUrl: 'https://images.unsplash.com/photo-1701463387028-3947648f1337?w=400',
      bannerUrl: 'https://images.unsplash.com/photo-1647247743538-0137d6a8a268?w=800'
    },
    visitors: [
      { id: '1', name: 'Sarah Zhang', role: 'ByteDance 产品经理', avatar: 'https://images.unsplash.com/photo-1573164713791-0dfcd2a183a7?w=200', time: '10分钟前' },
      { id: '2', name: 'David Li', role: '独立开发者', avatar: 'https://images.unsplash.com/photo-1664101606938-e664f5852fac?w=200', time: '2小时前' },
      { id: '3', name: 'Emily Wang', role: 'Adobe 设计师', avatar: 'https://images.unsplash.com/photo-1645951252284-4aa663bf59ca?w=200', time: '5小时前' }
    ]
  },

  onLoad() {
    this.loadCurrentCard()
  },

  onShow() {
    this.loadCurrentCard()
  },

  loadCurrentCard() {
    wx.cloud.callFunction({
      name: 'getCards',
      success: (res) => {
        if (res.result && res.result.success && res.result.defaultCard) {
          this.setData({ currentCard: res.result.defaultCard })
        }
      }
    })
  },

  goToMyCards() {
    wx.switchTab({ url: '/pages/mycards/mycards' })
  },

  goToVisitor() {
    wx.switchTab({ url: '/pages/visitor/visitor' })
  },

  goToExchange() {
    wx.navigateTo({ url: '/pages/exchange/exchange' })
  },

  goToAnalytics() {
    wx.switchTab({ url: '/pages/analytics/analytics' })
  },

  onShareAppMessage() {
    return { title: '查看我的名片', path: '/pages/home/home' }
  }
})
