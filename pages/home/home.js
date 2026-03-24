// pages/home/home.js
const app = getApp()

Page({
  data: {
    profile: {
      name: '陈小独立',
      role: 'OPC 创始人 / 全栈工程师',
      locationCountry: '中国',
      locationCity: '深圳',
      bio: '一名专注于构建 AI 工具与效率应用的独立开发者。我喜欢探索极致的产品体验，并将复杂的逻辑简化为直观的 UI。目前致力于 OPC (一人公司) 的规模化与自动化。',
      avatarUrl: 'https://images.unsplash.com/photo-1701463387028-3947648f1337?w=400',
      bannerUrl: 'https://images.unsplash.com/photo-1647247743538-0137d6a8a268?w=1080'
    },
    projects: [
      {
        id: '1',
        title: 'CodeFlow AI',
        description: '一个帮助独立开发者通过自然语言直接生成 React 组件的 AI 工作流。',
        thumbnail: 'https://images.unsplash.com/photo-1575388902449-6bca946ad549?w=800',
        link: 'https://codeflow.example.com',
        github: 'https://github.com/example/codeflow',
        tags: ['AI', 'React', 'SaaS']
      },
      {
        id: '2',
        title: 'ZenTask Mobile',
        description: '极简主义的个人效率工具，支持跨端同步与离线工作。',
        thumbnail: 'https://images.unsplash.com/photo-1758598303946-385680e4eabd?w=800',
        link: 'https://zentask.example.com',
        tags: ['Mobile', 'Flutter', 'Efficiency']
      }
    ],
    videos: [
      {
        id: 'v1',
        title: '演示：如何在 5 分钟内使用 CodeFlow AI 生成 UI',
        thumbnail: 'https://images.unsplash.com/photo-1647247743538-0137d6a8a268?w=800',
        views: '12k',
        duration: '01:45'
      }
    ]
  },

  onLoad() {
    this.loadProfile()
  },

  onShow() {
    this.loadProfile()
  },

  loadProfile() {
    wx.cloud.callFunction({
      name: 'getCards',
      success: (res) => {
        if (res.result && res.result.success && res.result.defaultCard) {
          const profile = res.result.defaultCard
          this.setData({ profile })
        }
      }
    })
  },

  onProjectTap(e) {
    const link = e.currentTarget.dataset.link
    if (link) {
      wx.navigateTo({
        url: `/pages/webview/webview?url=${encodeURIComponent(link)}`
      })
    }
  },

  onExchangeTap() {
    wx.navigateTo({ url: '/pages/exchangeconfirm/exchangeconfirm' })
  },

  onShareTap() {
    wx.setClipboardData({
      data: '查看我的个人名片: https://opc-card.example.com',
      success: () => {
        wx.showToast({ title: '链接已复制', icon: 'success' })
      }
    })
  },

  onShareAppMessage() {
    return {
      title: '查看我的个人名片',
      path: '/pages/home/home'
    }
  }
})
