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
    projects: [
      {
        id: '1',
        title: 'CodeFlow AI',
        description: '帮助独立开发者通过自然语言生成 React 组件',
        thumbnail: 'https://images.unsplash.com/photo-1575388902449-6bca946ad549?w=800',
        link: 'https://codeflow.example.com'
      },
      {
        id: '2',
        title: 'ZenTask Mobile',
        description: '极简主义个人效率工具',
        thumbnail: 'https://images.unsplash.com/photo-1758598303946-385680e4eabd?w=800',
        link: 'https://zentask.example.com'
      }
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

  goToContacts() {
    wx.switchTab({ url: '/pages/contacts/contacts' })
  },

  goToVisitor() {
    wx.switchTab({ url: '/pages/visitor/visitor' })
  },

  goToAnalytics() {
    wx.switchTab({ url: '/pages/analytics/analytics' })
  },

  onProjectTap(e) {
    const link = e.currentTarget.dataset.link
    if (link) {
      wx.navigateTo({ url: '/pages/webview/webview?url=' + encodeURIComponent(link) })
    }
  },

  onExchangeTap() {
    wx.navigateTo({ url: '/pages/exchangeconfirm/exchangeconfirm' })
  },

  onShareAppMessage() {
    return {
      title: '查看我的名片',
      path: '/pages/home/home'
    }
  }
})
