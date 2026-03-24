// custom-tab-bar.js - 线性图标风格
Component({
  data: {
    selected: 0,
    list: [
      { 
        pagePath: '/pages/home/home', 
        text: '工作台', 
        icon: 'grid-view',      // 未激活：线性
        iconActive: 'apps'     // 激活：实心
      },
      { 
        pagePath: '/pages/mycards/mycards', 
        text: '名片', 
        icon: 'id-card',
        iconActive: 'id-card'
      },
      { 
        pagePath: '/pages/contacts/contacts', 
        text: '联系人', 
        icon: 'people',
        iconActive: 'people'
      },
      { 
        pagePath: '/pages/management/management', 
        text: '管理', 
        icon: 'settings',
        iconActive: 'settings'
      }
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
