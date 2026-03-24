// analytics.js - 数据分析

Page({
  data: {
    stats: {
      totalViews: 1247,
      totalExchanges: 89,
      totalContacts: 156,
      weekViews: 234
    },
    trendData: [
      { day: '周一', value: 60 },
      { day: '周二', value: 45 },
      { day: '周三', value: 80 },
      { day: '周四', value: 70 },
      { day: '周五', value: 90 },
      { day: '周六', value: 55 },
      { day: '周日', value: 40 }
    ],
    sources: [
      { name: '微信分享', count: 456, percent: 80 },
      { name: 'NFC 碰一碰', count: 234, percent: 50 },
      { name: '二维码扫码', count: 189, percent: 40 },
      { name: '链接分享', count: 89, percent: 20 }
    ],
    popularCards: [
      { id: '1', name: '技术开发名片', views: 567 },
      { id: '2', name: '商务合作名片', views: 423 },
      { id: '3', name: '个人社交名片', views: 257 }
    ]
  }
})
