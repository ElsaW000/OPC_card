// mycards.js - 名片管理

const app = getApp()

Page({
  data: {
    currentIndex: 0,
    cards: []
  },

  onLoad() {
    this.loadCards()
  },

  onShow() {
    this.loadCards()
  },

  loadCards() {
    // 直接使用 mock 数据，确保预览正常显示
    const mockCards = this.getMockCards()
    this.setData({ 
      cards: mockCards,
      currentIndex: 0 
    })
    
    // 同时尝试从云端加载
    wx.cloud.callFunction({
      name: 'getCards',
      success: (res) => {
        if (res.result && res.result.success && res.result.data.length > 0) {
          this.setData({ cards: res.result.data })
        }
      }
    })
  },

  getMockCards() {
    return [
      {
        id: '1',
        type: 'tech',
        title: '技术开发名片',
        name: '陈小独立',
        nameEn: 'Independent Chen',
        role: 'Full-stack Developer',
        company: 'CodeFlow AI Studio',
        locationCountry: '中国',
        locationCity: '深圳',
        avatarUrl: 'https://images.unsplash.com/photo-1701463387028-3947648f1337?w=400',
        bannerUrl: 'https://images.unsplash.com/photo-1647247743538-0137d6a8a268?w=800',
        isDefault: true,
        typeIcon: '📱'
      },
      {
        id: '2',
        type: 'biz',
        title: '商务合作名片',
        name: 'Independent Chen',
        role: 'Founder & CEO',
        company: 'One Person Company Ltd.',
        locationCountry: '中国',
        locationCity: '深圳',
        avatarUrl: 'https://images.unsplash.com/photo-1701463387028-3947648f1337?w=400',
        bannerUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800',
        isDefault: false,
        typeIcon: '💼'
      },
      {
        id: '3',
        type: 'social',
        title: '个人社交名片',
        name: '阿力',
        role: '摄影爱好者 / 徒步玩家',
        locationCountry: '中国',
        locationCity: '深圳',
        avatarUrl: 'https://images.unsplash.com/photo-1701463387028-3947648f1337?w=400',
        bannerUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
        isDefault: false,
        typeIcon: '👥'
      }
    ]
  },

  switchCard(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ currentIndex: index })
  },

  editCard(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/edit/edit?id=' + id })
  },

  setDefault(e) {
    const id = e.currentTarget.dataset.id
    const cards = this.data.cards.map(card => ({
      ...card,
      isDefault: card.id === id
    }))
    this.setData({ cards })
    wx.showToast({ title: '已设为默认', icon: 'success' })
  },

  shareCard(e) {
    wx.showShareMenu({ withShareTicket: true })
  },

  deleteCard(e) {
    const id = e.currentTarget.dataset.id
    if (this.data.cards.length <= 1) {
      wx.showToast({ title: '至少保留一张', icon: 'none' })
      return
    }
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复',
      success: (res) => {
        if (res.confirm) {
          const cards = this.data.cards.filter(card => card.id !== id)
          this.setData({ cards })
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  },

  addCard() {
    wx.navigateTo({ url: '/pages/edit/edit' })
  }
})
