// custom-tab-bar.js
Component({
  data: {
    selected: 0,
    list: [
      { pagePath: 'pages/home/home', text: '工作台' },
      { pagePath: 'pages/mycards/mycards', text: '名片' },
      { pagePath: 'pages/contacts/contacts', text: '联系人' },
      { pagePath: 'pages/management/management', text: '管理' }
    ]
  },

  attached() {
    // 获取当前页面路径来设置选中状态
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const currentPath = currentPage.route
    const index = this.data.list.findIndex(item => item.pagePath === currentPath)
    if (index !== -1) {
      this.setData({ selected: index })
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
