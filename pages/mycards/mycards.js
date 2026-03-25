// mycards.js
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
    this.setData({
      cards: [
        {
          id: '1',
          type: 'tech',
          typeIcon: '📱',
          title: '技术开发名片',
          name: '陈小独立',
          role: 'Full-stack Developer',
          company: 'CODEFLOW AI STUDIO',
          avatarUrl: 'https://images.unsplash.com/photo-1701463387028-3947648f1337?w=400',
          bannerUrl: 'https://images.unsplash.com/photo-1647247743538-0137d6a8a268?w=800',
          isDefault: true
        },
        {
          id: '2',
          type: 'biz',
          typeIcon: '💼',
          title: '商务合作名片',
          name: 'Independent Chen',
          role: 'Founder & CEO',
          company: 'ONE PERSON COMPANY LTD.',
          avatarUrl: 'https://images.unsplash.com/photo-1701463387028-3947648f1337?w=400',
          bannerUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800',
          isDefault: false
        },
        {
          id: '3',
          type: 'social',
          typeIcon: '👥',
          title: '个人社交名片',
          name: '阿力',
          role: '摄影爱好者',
          avatarUrl: 'https://images.unsplash.com/photo-1701463387028-3947648f1337?w=400',
          bannerUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
          isDefault: false
        }
      ]
    })
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/cardDetail/cardDetail?id=' + id })
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
