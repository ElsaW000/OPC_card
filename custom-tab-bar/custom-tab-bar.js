// custom-tab-bar.js
Component({
  data: {
    selected: 0,
    contactCount: 3,
    list: [
      { pagePath: 'pages/home/home', text: '工作台' },
      { pagePath: 'pages/contacts/contacts', text: '联系人' },
      { pagePath: 'pages/exchange/exchange', text: '交换名片' },
      { pagePath: 'pages/mycards/mycards', text: '我的名片' },
      { pagePath: 'pages/management/management', text: '管理' }
    ]
  },

  attached() {
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const currentPath = currentPage.route
    
    // 根据页面路径设置选中状态
    const indexMap = {
      'pages/home/home': 0,
      'pages/contacts/contacts': 1,
      'pages/exchange/exchange': 2,
      'pages/mycards/mycards': 3,
      'pages/management/management': 4
    }
    
    if (indexMap[currentPath] !== undefined) {
      this.setData({ selected: indexMap[currentPath] })
    }
  },

  methods: {
    switchTab(e) {
      const { path, index } = e.currentTarget.dataset
      wx.switchTab({ url: '/' + path })
      this.setData({ selected: parseInt(index) })
    }
  }
})
