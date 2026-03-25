// home.js - å·¥ä½œå°

const app = getApp()

Page({
  data: {
    currentCard: {
      name: 'é™ˆç‹¬ç«‹',
      role: 'Full-stack Developer',
      locationCountry: 'ä¸­å›½',
      locationCity: 'æ·±åœ³',
      avatarUrl: 'https://images.unsplash.com/photo-1701463387028-3947648f1337?w=400',
      bannerUrl: 'https://images.unsplash.com/photo-1647247743538-0137d6a8a268?w=800'
    },
    visitors: [
      { id: '1', name: 'Sarah Zhang', role: 'ByteDance äº§å“ç»ç†', avatar: 'https://images.unsplash.com/photo-1573164713791-0dfcd2a183a7?w=200', time: '10 åˆ†é’Ÿå‰' },
      { id: '2', name: 'David Li', role: 'ç‹¬ç«‹å¼€å‘è€…', avatar: 'https://images.unsplash.com/photo-1664101606938-e664f5852fac?w=200', time: '2 å°æ—¶å‰' },
      { id: '3', name: 'Emily Wang', role: 'Adobe è®¾è®¡å¸ˆ', avatar: 'https://images.unsplash.com/photo-1645951252284-4aa663bf59ca?w=200', time: '5 å°æ—¶å‰' }
    ]
  },

  onLoad() {
    this.loadCurrentCard()
  },

  onShow() {
    const tabBar = this.getTabBar()
    if (tabBar && tabBar.data) {
      tabBar.setData({ selected: 2 })
    }

    
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
    wx.navigateTo({ url: '/pages/exchangeconfirm/exchangeconfirm' })
  },

  goToAnalytics() {
    wx.switchTab({ url: '/pages/analytics/analytics' })
  },

  onShareAppMessage() {
    return { title: 'æŸ¥çœ‹æˆ‘çš„åç‰‡', path: '/pages/home/home' }
  }
})