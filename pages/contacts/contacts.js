// contacts.js - åç‰‡è”ç³»äºº

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
    const tabBar = this.getTabBar()
    if (tabBar && tabBar.data) {
      tabBar.setData({ selected: 1 })
    }

    
    this.loadContacts()
  },

  loadContacts() {
    wx.showLoading({ title: 'åŠ è½½ä¸­...' })
    
    wx.cloud.callFunction({
      name: 'getContacts',
      success: (res) => {
        wx.hideLoading()
        if (res.result && res.result.success) {
          const contacts = res.result.data || []
          
          // æå–æ‰€æœ‰æ ‡ç­¾
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
        // ä½¿ç”¨æ¨¡æ‹Ÿæ•°æ®
        this.setData({
          contacts: this.getMockContacts(),
          filteredContacts: this.getMockContacts(),
          allTags: ['AI', 'äº§å“', 'æŠ€æœ¯', 'è®¾è®¡']
        })
      }
    })
  },

  getMockContacts() {
    return [
      {
        id: '1',
        name: 'Sarah Zhang',
        role: 'é«˜çº§äº§å“ç»ç†',
        company: 'ByteDance',
        locationCountry: 'åŒ—äº¬',
        locationCity: '',
        avatarUrl: 'https://images.unsplash.com/photo-1573164713791-0dfcd2a183a7?w=200',
        tags: ['AI', 'Bç«¯äº§å“', 'å‡ºæµ·'],
        lastActiveText: '10åˆ†é’Ÿå‰',
        isStarred: true
      },
      {
        id: '2',
        name: 'David Li',
        role: 'ç‹¬ç«‹å¼€å‘è€…',
        company: 'Solopreneur',
        locationCountry: 'æ­å·ž',
        locationCity: '',
        avatarUrl: 'https://images.unsplash.com/photo-1664101606938-e664f5852fac?w=200',
        tags: ['Flutter', 'Rust', 'Web3'],
        lastActiveText: '2å°æ—¶å‰',
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
    
    // æŒ‰æ ‡ç­¾ç­›é€‰
    if (this.data.currentTag === 'starred') {
      contacts = contacts.filter(c => c.isStarred)
    } else if (this.data.currentTag) {
      contacts = contacts.filter(c => c.tags && c.tags.includes(this.data.currentTag))
    }
    
    // æŒ‰å…³é”®è¯æœç´¢
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
      title: 'å·²æ”¶è—',
      icon: 'success'
    })
  },

  sendMessage(e) {
    const id = e.currentTarget.dataset.id
    wx.showToast({
      title: 'å‘èµ·èŠå¤©',
      icon: 'none'
    })
  }
})
