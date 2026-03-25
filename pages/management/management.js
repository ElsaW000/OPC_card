// management.js

Page({
  data: {
    profile: {
      name: 'é™ˆå°ç‹¬ç«‹',
      role: 'Full-stack Developer',
      avatarUrl: 'https://images.unsplash.com/photo-1701463387028-3947648f1337?w=400'
    },
    menuItems: [
      { id: '1', name: 'æˆ‘çš„åç‰‡', icon: 'ðŸ“‡', path: '/pages/mycards/mycards' },
      { id: '2', name: 'è”ç³»äºº', icon: 'ðŸ‘¥', path: '/pages/contacts/contacts' },
      { id: '3', name: 'è®¿å®¢ç®¡ç†', icon: 'ðŸ‘', path: '/pages/visitor/visitor' },
      { id: '4', name: 'æ‰‹æœºå·ç»‘å®š', icon: 'ðŸ“±', path: '' },
      { id: '5', name: 'éšç§æ”¿ç­–', icon: 'ðŸ”’', path: '' }
    ]
  },

  onMenuTap(e) {
    const path = e.currentTarget.dataset.path
    if (path) {
      wx.navigateTo({ url: path })
    }
  }
})
