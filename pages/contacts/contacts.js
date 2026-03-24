// contacts.js - 名片联系人

Page({
  data: {
    contacts: [],
    filteredContacts: [],
    allTags: [],
    currentTag: '',
    searchKeyword: ''
  },

  onLoad() {
    this.loadContacts()
  },

  onShow() {
    this.loadContacts()
  },

  loadContacts() {
    wx.showLoading({ title: '加载中...' })
    
    wx.cloud.callFunction({
      name: 'getContacts',
      success: (res) => {
        wx.hideLoading()
        if (res.result && res.result.success) {
          const contacts = res.result.data || []
          
          // 提取所有标签
          const tagSet = new Set()
          contacts.forEach(c => {
            if (c.tags) {
              c.tags.forEach(t => tagSet.add(t))
            }
          })
          
          this.setData({
            contacts: contacts,
            filteredContacts: contacts,
            allTags: Array.from(tagSet)
          })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        // 使用模拟数据
        this.setData({
          contacts: this.getMockContacts(),
          filteredContacts: this.getMockContacts(),
          allTags: ['AI', '产品', '技术', '设计']
        })
      }
    })
  },

  getMockContacts() {
    return [
      {
        id: '1',
        name: 'Sarah Zhang',
        role: '高级产品经理',
        company: 'ByteDance',
        locationCountry: '北京',
        locationCity: '',
        avatarUrl: 'https://images.unsplash.com/photo-1573164713791-0dfcd2a183a7?w=200',
        tags: ['AI', 'B端产品', '出海'],
        lastActiveText: '10分钟前',
        isStarred: true
      },
      {
        id: '2',
        name: 'David Li',
        role: '独立开发者',
        company: 'Solopreneur',
        locationCountry: '杭州',
        locationCity: '',
        avatarUrl: 'https://images.unsplash.com/photo-1664101606938-e664f5852fac?w=200',
        tags: ['Flutter', 'Rust', 'Web3'],
        lastActiveText: '2小时前',
        isStarred: false
      }
    ]
  },

  onSearch(e) {
    const keyword = e.detail.value
    this.setData({ searchKeyword: keyword })
    this.filterContacts()
  },

  filterByTag(e) {
    const tag = e.currentTarget.dataset.tag
    this.setData({ currentTag: tag })
    this.filterContacts()
  },

  filterContacts() {
    let contacts = this.data.contacts
    
    // 按标签筛选
    if (this.data.currentTag === 'starred') {
      contacts = contacts.filter(c => c.isStarred)
    } else if (this.data.currentTag) {
      contacts = contacts.filter(c => c.tags && c.tags.includes(this.data.currentTag))
    }
    
    // 按关键词搜索
    if (this.data.searchKeyword) {
      const keyword = this.data.searchKeyword.toLowerCase()
      contacts = contacts.filter(c => 
        c.name.toLowerCase().includes(keyword) ||
        c.role.toLowerCase().includes(keyword) ||
        c.company.toLowerCase().includes(keyword)
      )
    }
    
    this.setData({ filteredContacts: contacts })
  },

  viewContact(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/contactdetail/contactdetail?id=${id}`
    })
  },

  toggleStar(e) {
    const id = e.currentTarget.dataset.id
    wx.showToast({
      title: '已收藏',
      icon: 'success'
    })
  },

  sendMessage(e) {
    const id = e.currentTarget.dataset.id
    wx.showToast({
      title: '发起聊天',
      icon: 'none'
    })
  }
})
