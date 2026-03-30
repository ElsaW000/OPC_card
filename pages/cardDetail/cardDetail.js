const app = getApp()
const { getCardViewAsync } = require('../../services/cardService')
const { bootstrapSessionAsync } = require('../../services/userService')

const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1647247743538-0137d6a8a268?w=1200'
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1701463387028-3947648f1337?w=400'
const DEFAULT_PROJECT_COVER = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900'
const DEFAULT_VIDEO_COVER = 'https://images.unsplash.com/photo-1647247743538-0137d6a8a268?w=900'

const TEXT = {
  unnamedProject: '\u672a\u547d\u540d\u9879\u76ee',
  pendingProject: '\u7b49\u5f85\u8865\u5145\u9879\u76ee\u8bf4\u660e',
  demoVideo: '\u6f14\u793a\u89c6\u9891',
  years: '\u5f00\u53d1\u5e74\u9650',
  products: '\u4e0a\u7ebf\u4ea7\u54c1',
  users: '\u5168\u7403\u7528\u6237',
  phone: '\u624b\u673a',
  email: '\u90ae\u7bb1',
  wechat: '\u5fae\u4fe1',
  defaultName: '\u9648\u5c0f\u72ec\u7acb',
  defaultRole: 'OPC \u521b\u59cb\u4eba / \u5168\u6808\u5de5\u7a0b\u5e08',
  defaultBio: '\u4e00\u540d\u4e13\u6ce8\u4e8e\u6784\u5efa AI \u5de5\u5177\u4e0e\u6548\u7387\u4ea7\u54c1\u7684\u72ec\u7acb\u5f00\u53d1\u8005\uff0c\u6301\u7eed\u6253\u78e8\u4ea7\u54c1\u4f53\u9a8c\uff0c\u5e76\u628a\u590d\u6742\u903b\u8f91\u8f6c\u5316\u6210\u76f4\u89c2\u7684\u754c\u9762\u3002',
  defaultReady: '\u5f53\u524d\u5df2\u662f\u9ed8\u8ba4\u540d\u7247',
  defaultTodo: '\u9ed8\u8ba4\u540d\u7247\u529f\u80fd\u5f85\u63a5\u771f\u5b9e\u63a5\u53e3',
  shareOpened: '\u5df2\u6253\u5f00\u5206\u4eab\u9762\u677f',
  shareCard: '\u5206\u4eab\u540d\u7247',
  viewQr: '\u67e5\u770b\u4e8c\u7ef4\u7801',
  detailLoadFailed: '\u540d\u7247\u8be6\u60c5\u52a0\u8f7d\u5931\u8d25',
}

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
    title: toStringValue(project.title, TEXT.unnamedProject),
    description: toStringValue(project.description, TEXT.pendingProject),
    thumbnail: toStringValue(project.thumbnail || project.cover, DEFAULT_PROJECT_COVER),
    link: toStringValue(project.link),
    github: toStringValue(project.github),
    tags: toTagList(project.tags, ['AI', 'React', 'SaaS'])
  }
}

function normalizeVideo(video = {}, index = 0) {
  return {
    id: toStringValue(video.id, `video-${index}`),
    title: toStringValue(video.title, TEXT.demoVideo),
    thumbnail: toStringValue(video.thumbnail || video.cover, DEFAULT_VIDEO_COVER),
    views: toStringValue(video.views, '12k'),
    duration: toStringValue(video.duration, '01:45')
  }
}

function buildStats(card = {}) {
  return [
    { key: 'years', value: toStringValue(card.years, '8+'), label: TEXT.years },
    { key: 'products', value: toStringValue(card.products, '12'), label: TEXT.products },
    { key: 'users', value: toStringValue(card.users, '25k'), label: TEXT.users }
  ]
}

function buildContactItems(card = {}) {
  const items = []

  if (card.phone) {
    items.push({ key: 'phone', icon: '/images/icons/phone.png', label: TEXT.phone, value: toStringValue(card.phone) })
  }
  if (card.email) {
    items.push({ key: 'email', icon: '', emoji: TEXT.email.slice(0, 1), label: TEXT.email, value: toStringValue(card.email) })
  }
  if (card.wechat) {
    items.push({ key: 'wechat', icon: '', emoji: TEXT.wechat.slice(0, 1), label: TEXT.wechat, value: toStringValue(card.wechat) })
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
    name: toStringValue(card.name, TEXT.defaultName),
    nameEn: toStringValue(card.nameEn, 'Independent Chen'),
    role: toStringValue(card.role, TEXT.defaultRole),
    company: toStringValue(card.company, 'OPC'),
    bio: toStringValue(card.bio, TEXT.defaultBio),
    bannerUrl: toStringValue(card.bannerUrl, DEFAULT_BANNER),
    avatarUrl: toStringValue(card.avatarUrl, DEFAULT_AVATAR),
    isDefault: !!card.isDefault,
    location,
    phone: toStringValue(card.phone, '138 0013 8000'),
    email: toStringValue(card.email, 'chen@example.com'),
    wechat: toStringValue(card.wechat, 'indie-chen'),
    stats: buildStats(card),
    tags,
    projects: projects.length ? projects : [normalizeProject({
      id: 'project-1',
      title: 'CodeFlow AI',
      description: '\u5e2e\u52a9\u72ec\u7acb\u5f00\u53d1\u8005\u7528\u81ea\u7136\u8bed\u8a00\u5feb\u901f\u751f\u6210\u754c\u9762\u4e0e\u7ec4\u4ef6\u7684 AI \u5de5\u4f5c\u6d41\u3002',
      thumbnail: DEFAULT_PROJECT_COVER,
      link: '\u5728\u7ebf\u4f53\u9a8c',
      github: 'GitHub',
      tags: ['AI', 'React', 'SaaS']
    })],
    videos: videos.length ? videos : [normalizeVideo({
      id: 'video-1',
      title: '\u6f14\u793a\uff1a\u5982\u4f55\u5728 5 \u5206\u949f\u5185\u7528 CodeFlow AI \u751f\u6210 UI',
      thumbnail: DEFAULT_VIDEO_COVER,
      views: '12k',
      duration: '01:45'
    })]
  }
}

function getMockCards() {
  return [{
    id: '1',
    name: TEXT.defaultName,
    nameEn: 'Independent Chen',
    role: TEXT.defaultRole,
    company: 'OPC',
    bio: TEXT.defaultBio,
    avatarUrl: DEFAULT_AVATAR,
    bannerUrl: DEFAULT_BANNER,
    isDefault: true,
    locationCountry: '\u4e2d\u56fd',
    locationCity: '\u6df1\u5733',
    years: '8+',
    products: '12',
    users: '25k',
    phone: '138 0013 8000',
    email: 'chen@example.com',
    wechat: 'indie-chen',
    techStack: 'AI, React, SaaS',
    projects: [{
      id: 'p1',
      title: 'CodeFlow AI',
      description: '\u5e2e\u52a9\u72ec\u7acb\u5f00\u53d1\u8005\u901a\u8fc7\u81ea\u7136\u8bed\u8a00\u5feb\u901f\u642d\u5efa\u9875\u9762\u4e0e\u7ec4\u4ef6\u3002',
      thumbnail: DEFAULT_PROJECT_COVER,
      link: '\u5728\u7ebf\u4f53\u9a8c',
      github: 'GitHub',
      tags: ['AI', 'React', 'SaaS']
    }],
    videos: [{
      id: 'v1',
      title: '\u6f14\u793a\uff1a\u5982\u4f55\u5728 5 \u5206\u949f\u5185\u7528 CodeFlow AI \u751f\u6210 UI',
      thumbnail: DEFAULT_VIDEO_COVER,
      views: '12k',
      duration: '01:45'
    }]
  }]
}

Page({
  data: {
    card: null,
    contactItems: []
  },

  onLoad(options) {
    const cardId = options && options.id ? options.id : ''
    this.cardId = cardId
    this.loadCard(cardId)
  },

  async loadCard(id) {
    try {
      await bootstrapSessionAsync()
      const result = await getCardViewAsync(id || '')
      if (result && result.success && result.data) {
        const card = buildSafeCard(result.data)
        this.setData({
          card,
          contactItems: buildContactItems(card)
        })
        return
      }
    } catch (error) {
      console.error('load card detail failed:', error)
    }

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

  editCard() {
    const cardId = this.data.card && this.data.card.id ? this.data.card.id : ''
    wx.navigateTo({ url: `/pages/edit/edit?id=${cardId}` })
  },

  shareCard() {
    wx.showShareMenu({ withShareTicket: true })
    wx.showToast({ title: TEXT.shareOpened, icon: 'none' })
  },

  setDefaultCard() {
    const message = this.data.card && this.data.card.isDefault ? TEXT.defaultReady : TEXT.defaultTodo
    wx.showToast({ title: message, icon: 'none' })
  },

  previewQrcode() {
    const cardId = this.data.card && this.data.card.id ? this.data.card.id : ''
    wx.navigateTo({ url: `/pages/qrcode/qrcode?id=${cardId}` })
  },

  showMoreActions() {
    wx.showActionSheet({
      itemList: [TEXT.shareCard, TEXT.viewQr],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.shareCard()
          return
        }
        this.previewQrcode()
      }
    })
  },

  exchangeCard() {
    wx.navigateTo({ url: '/pages/exchange/exchange' })
  }
})
