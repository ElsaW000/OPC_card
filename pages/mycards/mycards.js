// mycards.js - 名片夹管理

const app = getApp()

Page({
  data: {
    cards: []
  },

  onLoad() {
    this.loadCards()
  },

  onShow() {
    this.loadCards()
  },

  loadCards() {
    wx.showLoading({ title: '加载中...' })
    
    wx.cloud.callFunction({
      name: 'getCards',
      success: (res) => {
        wx.hideLoading()
        if (res.result && res.result.success && res.result.data.length > 0) {
          const cards = res.result.data
          
          // 添加类型图标和颜色
          const cardsWithStyle = cards.map(card => ({
            ...card,
            typeIcon: this.getTypeIcon(card.type),
            colorClass: this.getColorClass(card.type)
          }))
          
          this.setData({ cards: cardsWithStyle })
        } else {
          // 使用 Mock Data
          this.setData({ cards: this.getMockCards() })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        // 使用 Mock Data
        this.setData({ cards: this.getMockCards() })
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
        colorClass: 'bg-blue',
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
        colorClass: 'bg-slate',
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
        colorClass: 'bg-green',
        typeIcon: '👥'
      }
    ]
  },

  getTypeIcon(type) {
    const icons = {
      tech: '📱',
      biz: '💼',
      social: '👥',
      custom: '⭐'
    }
    return icons[type] || '⭐'
  },

  getColorClass(type) {
    const colors = {
      tech: 'bg-blue',
      biz: 'bg-slate',
      social: 'bg-green',
      custom: 'bg-purple'
    }
    return colors[type] || 'bg-blue'
  },

  // 编辑名片
  editCard(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/edit/edit?id=${id}`
    })
  },

  // 设为默认
  setDefault(e) {
    const id = e.currentTarget.dataset.id
    
    wx.showLoading({ title: '设置中...' })
    
    wx.cloud.callFunction({
      name: 'setDefaultCard',
      data: { cardId: id },
      success: (res) => {
        wx.hideLoading()
        if (res.result && res.result.success) {
          wx.showToast({ title: '已设为默认', icon: 'success' })
          this.loadCards()
        }
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({ title: '设置失败', icon: 'none' })
      }
    })
  },

  // 分享名片
  shareCard(e) {
    const id = e.currentTarget.dataset.id
    wx.showShareMenu({
      withShareTicket: true
    })
  },

  // 交换名片
  exchangeCard(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/exchangeconfirm/exchangeconfirm?id=' + id
    })
  },

  // 删除名片
  deleteCard(e) {
    const id = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这张名片吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' })
          
          wx.cloud.callFunction({
            name: 'deleteCard',
            data: { cardId: id },
            success: (res) => {
              wx.hideLoading()
              if (res.result && res.result.success) {
                wx.showToast({ title: '已删除', icon: 'success' })
                this.loadCards()
              }
            },
            fail: (err) => {
              wx.hideLoading()
              wx.showToast({ title: '删除失败', icon: 'none' })
            }
          })
        }
      }
    })
  },

  // 添加新名片
  addCard() {
    wx.navigateTo({
      url: '/pages/edit/edit'
    })
  }
})
