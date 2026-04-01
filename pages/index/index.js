const app = getApp()

function normalizeText(value, fallback = '') {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return []
  return tags.map((tag) => normalizeText(tag)).filter(Boolean)
}

function buildSafeIndexData(source = {}) {
  return {
    name: normalizeText(source.name, '\u5f20\u4e09'),
    nameEn: normalizeText(source.nameEn),
    role: normalizeText(source.role || source.position, '\u524d\u7aef\u5f00\u53d1\u8005'),
    locationCountry: normalizeText(source.locationCountry),
    locationCity: normalizeText(source.locationCity),
    company: normalizeText(source.company, 'eSeat'),
    phone: normalizeText(source.phone, '13800138000'),
    email: normalizeText(source.email, 'zhangsan@opc.com'),
    wechat: normalizeText(source.wechat),
    avatarUrl: normalizeText(source.avatarUrl || source.avatar, 'https://example.com/avatar.jpg'),
    qrCode: normalizeText(source.qrCode, 'https://example.com/qrcode.png'),
    bio: normalizeText(source.bio),
    githubUrl: normalizeText(source.githubUrl),
    twitterUrl: normalizeText(source.twitterUrl),
    currentTemplate: normalizeText(source.currentTemplate, 'universal'),
    years: normalizeText(source.years),
    techStack: normalizeText(source.techStack),
    portfolio: normalizeText(source.portfolio),
    styles: normalizeText(source.styles),
    experience: normalizeText(source.experience),
    business: normalizeText(source.business),
    cooperation: normalizeText(source.cooperation),
    products: normalizeText(source.products),
    users: normalizeText(source.users),
    footerTitle: normalizeText(source.footerTitle),
    footerDesc: normalizeText(source.footerDesc),
    customCards: Array.isArray(source.customCards) ? source.customCards.map((item, index) => ({
      id: normalizeText(item && (item.id || item._id), `custom_${index}`),
      title: normalizeText(item && item.title),
      content: normalizeText(item && item.content)
    })) : [],
    projects: Array.isArray(source.projects) ? source.projects.map((item, index) => ({
      id: normalizeText(item && (item.id || item._id), `project_${index}`),
      title: normalizeText(item && item.title),
      description: normalizeText(item && item.description),
      thumbnail: normalizeText(item && item.thumbnail),
      link: normalizeText(item && item.link),
      github: normalizeText(item && item.github),
      tags: normalizeTags(item && item.tags)
    })) : [],
    videos: Array.isArray(source.videos) ? source.videos.map((item, index) => ({
      id: normalizeText(item && (item.id || item._id), `video_${index}`),
      title: normalizeText(item && item.title),
      thumbnail: normalizeText(item && item.thumbnail),
      link: normalizeText(item && item.link),
      views: normalizeText(item && item.views),
      duration: normalizeText(item && item.duration)
    })) : []
  }
}

Page({
  data: buildSafeIndexData(),

  onLoad() {
    const cardData = app.globalData.cardData
    if (cardData) {
      this.setData(buildSafeIndexData(cardData))
    }
  },

  onShow() {
    const cardData = app.globalData.cardData
    if (cardData) {
      this.setData(buildSafeIndexData(cardData))
    }
  },

  callPhone() {
    wx.makePhoneCall({
      phoneNumber: this.data.phone
    })
  },

  copyEmail() {
    wx.setClipboardData({
      data: this.data.email,
      success: () => {
        wx.showToast({
          title: '\u90ae\u7bb1\u5df2\u590d\u5236',
          icon: 'success'
        })
      }
    })
  },

  copyWechat() {
    if (!this.data.wechat) return
    wx.setClipboardData({ data: this.data.wechat })
  },

  saveContact() {
    wx.addPhoneContact({
      firstName: this.data.name,
      mobilePhoneNumber: this.data.phone,
      email: this.data.email
    })
  },

  shareCard() {
    wx.showShareMenu({
      withShareTicket: true
    })
  },

  openLink(e) {
    const link = e.currentTarget.dataset.link
    if (link) {
      wx.navigateTo({
        url: `/pages/webview/webview?url=${encodeURIComponent(link)}`
      })
    } else {
      wx.showToast({
        title: '\u94fe\u63a5\u65e0\u6548',
        icon: 'none'
      })
    }
  },

  editCard() {
    wx.navigateTo({
      url: '/pages/edit/edit'
    })
  }
})