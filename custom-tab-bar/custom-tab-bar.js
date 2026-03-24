// custom-tab-bar.js
Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/home/home', text: '工作台', icon: '📊' },
      { pagePath: '/pages/mycards/mycards', text: '名片', icon: '📇' },
      { pagePath: '/pages/contacts/contacts', text: '联系人', icon: '👥' },
      { pagePath: '/pages/management/management', text: '管理', icon: '⚙️' }
    ]
  },

  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      const url = data.path
      wx.switchTab({ url })
      this.setData({ selected: data.index })
    }
  }
})
