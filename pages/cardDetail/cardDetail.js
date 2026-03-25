// cardDetail.js

Page({
  data: {
    card: {}
  },

  onLoad(options) {
    if (options.id) {
      this.loadCard(options.id)
    }
  },

  loadCard(id) {
    // 模拟数据，实际应该从云端获取
    const cards = [
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
    
    const card = cards.find(c => c.id === id)
    if (card) {
      this.setData({ card })
    }
  },

  goBack() {
    wx.navigateBack()
  },

  editCard() {
    wx.navigateTo({ url: '/pages/edit/edit?id=' + this.data.card.id })
  },

  shareCard() {
    wx.showShareMenu({ withShareTicket: true })
  }
})
