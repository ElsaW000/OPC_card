// management.js

Page({
  data: {
    profile: {
      name: '陈小独立',
      role: 'Full-stack Developer',
      avatarUrl: 'https://images.unsplash.com/photo-1701463387028-3947648f1337?w=400'
    },
    menuItems: [
      { id: '1', name: '我的名片', icon: '📇', path: '/pages/mycards/mycards' },
      { id: '2', name: '联系人', icon: '👥', path: '/pages/contacts/contacts' },
      { id: '3', name: '访客管理', icon: '👁', path: '/pages/visitor/visitor' },
      { id: '4', name: '手机号绑定', icon: '📱', path: '' },
      { id: '5', name: '隐私政策', icon: '🔒', path: '' }
    ]
  },

  onMenuTap(e) {
    const path = e.currentTarget.dataset.path
    if (path) {
      wx.navigateTo({ url: path })
    }
  }
})
