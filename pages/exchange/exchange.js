// exchange.js

Page({
  data: {
    stats: {
      total: 42,
      month: 8,
      week: 3
    },
    records: [
      { id: '1', name: 'Sarah Zhang', role: '产品经理 @ ByteDance', avatar: 'https://images.unsplash.com/photo-1573164713791-0dfcd2a183a7?w=200', time: '10分钟前', status: 'success' },
      { id: '2', name: 'David Li', role: '独立开发者', avatar: 'https://images.unsplash.com/photo-1664101606938-e664f5852fac?w=200', time: '2小时前', status: 'success' },
      { id: '3', name: 'Emily Wang', role: '设计师 @ Adobe', avatar: 'https://images.unsplash.com/photo-1645951252284-4aa663bf59ca?w=200', time: '昨天', status: 'success' },
      { id: '4', name: 'John Chen', role: '创业者', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', time: '昨天', status: 'pending' }
    ]
  },

  onLoad() {
    this.loadRecords()
  },

  loadRecords() {
    wx.cloud.callFunction({
      name: 'getExchangeRecords',
      success: (res) => {
        if (res.result && res.result.success) {
          this.setData({ records: res.result.data })
        }
      }
    })
  }
})
