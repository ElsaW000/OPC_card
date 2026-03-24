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
        if (res.result && res.result.success) {
          const cards = res.result.data || []
          
          // 添加类型图标和颜色
          const cardsWithStyle = cards.map(card => ({
            ...card,
            typeIcon: this.getTypeIcon(card.type),
            colorClass: this.getColorClass(card.type)
          }))
          
          this.setData({ cards: cardsWithStyle })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('加载失败', err)
      }
    })
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
