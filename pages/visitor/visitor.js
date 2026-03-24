// visitor.js - 访客记录

Page({
  data: {
    currentTab: 'all',
    visitors: [
      {
        id: '1',
        name: 'Sarah Zhang',
        role: '产品经理',
        avatarUrl: 'https://images.unsplash.com/photo-1573164713791-0dfcd2a183a7?w=200',
        viewTime: '10分钟前',
        source: '微信分享'
      },
      {
        id: '2',
        name: 'David Li',
        role: '独立开发者',
        avatarUrl: 'https://images.unsplash.com/photo-1664101606938-e664f5852fac?w=200',
        viewTime: '2小时前',
        source: 'NFC 碰一碰'
      }
    ]
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })
  },

  exchangeCard(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/exchangeconfirm/exchangeconfirm?id=${id}`
    })
  }
})
