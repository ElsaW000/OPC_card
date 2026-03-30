const app = getApp()

const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1647247743538-0137d6a8a268?w=1200'
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1701463387028-3947648f1337?w=400'
const DEFAULT_PROJECT_COVER = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900'
const DEFAULT_VIDEO_COVER = 'https://images.unsplash.com/photo-1647247743538-0137d6a8a268?w=900'

function toStringValue(value, fallback = '') {
  if (value === undefined || value === null) {
    return fallback
  }
  return String(value)
}

function toTagList(value, fallback) {
  if (Array.isArray(value)) {
    return value.map((item) => toStringValue(item).trim()).filter(Boolean)
  }
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }
  return fallback
}

function normalizeProject(project = {}, index = 0) {
  return {
    id: toStringValue(project.id, `project-${index}`),
    title: toStringValue(project.title, '未命名项目'),
    description: toStringValue(project.description, '等待补充项目说明'),
    thumbnail: toStringValue(project.thumbnail || project.cover, DEFAULT_PROJECT_COVER),
    link: toStringValue(project.link),
    github: toStringValue(project.github),
    tags: toTagList(project.tags, ['AI', 'React', 'SaaS'])
  }
}

function normalizeVideo(video = {}, index = 0) {
  return {
    id: toStringValue(video.id, `video-${index}`),
    title: toStringValue(video.title, '演示视频'),
    thumbnail: toStringValue(video.thumbnail || video.cover, DEFAULT_VIDEO_COVER),
    views: toStringValue(video.views, '12k'),
    duration: toStringValue(video.duration, '01:45')
  }
}

function buildStats(card = {}) {
  return [
    { key: 'years', value: toStringValue(card.years, '8+'), label: '开发年限' },
    { key: 'products', value: toStringValue(card.products, '12'), label: '上线产品' },
    { key: 'users', value: toStringValue(card.users, '25k'), label: '全球用户' }
  ]
}

function buildContactItems(card = {}) {
  const items = []

  if (card.phone) {
    items.push({ key: 'phone', icon: '/images/icons/phone.png', label: '手机', value: toStringValue(card.phone) })
  }
  if (card.email) {
    items.push({ key: 'email', icon: '', emoji: '邮箱'.slice(0, 1), label: '邮箱', value: toStringValue(card.email) })
  }
  if (card.wechat) {
    items.push({ key: 'wechat', icon: '', emoji: '微信'.slice(0, 1), label: '微信', value: toStringValue(card.wechat) })
  }

  return items
}

function buildSafeCard(card = {}) {
  const tags = toTagList(card.tags || card.techStack, ['AI', 'React', 'SaaS'])
  const projects = Array.isArray(card.projects) ? card.projects.map(normalizeProject) : []
  const videos = Array.isArray(card.videos) ? card.videos.map(normalizeVideo) : []
  const location = [toStringValue(card.locationCountry), toStringValue(card.locationCity)].filter(Boolean).join(' ? ')

  return {
    id: toStringValue(card.id || card._id),
    name: toStringValue(card.name, '陈小独立'),
    nameEn: toStringValue(card.nameEn, 'Independent Chen'),
    role: toStringValue(card.role, 'OPC 创始人 / 全栈工程师'),
    company: toStringValue(card.company, 'OPC'),
    bio: toStringValue(card.bio, '一名专注于构建 AI 工具与效率产品的独立开发者，持续打磨产品体验，并把复杂逻辑转化成直观的界面。'),
    bannerUrl: toStringValue(card.bannerUrl, DEFAULT_BANNER),
    avatarUrl: toStringValue(card.avatarUrl, DEFAULT_AVATAR),
    isDefault: !!card.isDefault,
    location,
    phone: toStringValue(card.phone, '138 0013 8000'),
    email: toStringValue(card.email, 'chen@example.com'),
    wechat: toStringValue(card.wechat, 'indie-chen'),
    stats: buildStats(card),
    tags,
    projects: projects.length ? projects : [normalizeProject({ id: 'project-1', title: 'CodeFlow AI', description: '帮助独立开发者用自然语言快速生成界面与组件的 AI 工作流。', thumbnail: DEFAULT_PROJECT_COVER, link: '在线体验', github: 'GitHub', tags: ['AI', 'React', 'SaaS'] })],
    videos: videos.length ? videos : [normalizeVideo({ id: 'video-1', title: '演示：如何在 5 分钟内用 CodeFlow AI 生成 UI', thumbnail: DEFAULT_VIDEO_COVER, views: '12k', duration: '01:45' })]
  }
}

function getMockCards() {
  return [
    {
      id: '1',
      name: '陈小独立',
      nameEn: 'Independent Chen',
      role: 'OPC 创始人 / 全栈工程师',
      company: 'OPC',
      bio: '一名专注于构建 AI 工具与效率产品的独立开发者，持续打磨产品体验，并把复杂逻辑转化成直观的界面。',
      avatarUrl: DEFAULT_AVATAR,
      bannerUrl: DEFAULT_BANNER,
      isDefault: true,
      locationCountry: '中国',
      locationCity: '深圳',
      years: '8+',
      products: '12',
      users: '25k',
      phone: '138 0013 8000',
      email: 'chen@example.com',
      wechat: 'indie-chen',
      techStack: 'AI, React, SaaS',
      projects: [{ id: 'p1', title: 'CodeFlow AI', description: '帮助独立开发者用自然语言快速生成界面与组件的 AI 工作流。', thumbnail: DEFAULT_PROJECT_COVER, link: '在线体验', github: 'GitHub', tags: ['AI', 'React', 'SaaS'] }],
      videos: [{ id: 'v1', title: '演示：如何在 5 分钟内用 CodeFlow AI 生成 UI', thumbnail: DEFAULT_VIDEO_COVER, views: '12k', duration: '01:45' }]
    }
  ]
}

Page({
  data: {
    card: null,
    contactItems: []
  },

  onLoad(options) {
    const cardId = options && options.id ? options.id : '1'
    this.loadCard(cardId)
  },

  loadCard(id) {
    const source = app.globalData && app.globalData.cardData
      ? [app.globalData.cardData].concat(getMockCards())
      : getMockCards()

    const matched = source.find((item) => String(item.id || item._id) === String(id)) || source[0]
    const card = buildSafeCard(matched)

    this.setData({
      card,
      contactItems: buildContactItems(card)
    })
  },

  goBack() {
    wx.navigateBack({ delta: 1 })
  },

  showMoreActions() {
    wx.showActionSheet({
      itemList: ['分享名片', '查看二维码'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.shareCard()
          return
        }
        this.previewQrcode()
      }
    })
  },

  editCard() {
    const cardId = this.data.card && this.data.card.id ? this.data.card.id : ''
    wx.navigateTo({ url: `/pages/edit/edit?id=${cardId}` })
  },

  shareCard() {
    wx.showShareMenu({ withShareTicket: true })
    wx.showToast({ title: '已打开分享面板', icon: 'none' })
  },

  setDefaultCard() {
    const message = this.data.card && this.data.card.isDefault ? '当前已是默认名片' : '默认名片功能待接真实接口'
    wx.showToast({ title: message, icon: 'none' })
  },

  previewQrcode() {
    const cardId = this.data.card && this.data.card.id ? this.data.card.id : ''
    wx.navigateTo({ url: `/pages/qrcode/qrcode?id=${cardId}` })
  },

  exchangeCard() {
    wx.navigateTo({ url: '/pages/exchange/exchange' })
  }
})
