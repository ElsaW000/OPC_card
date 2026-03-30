const { getWorkbenchAsync } = require('../../services/workbenchService')
const { bootstrapSessionAsync } = require('../../services/userService')

const TEXT = {
  workbench: '\u5de5\u4f5c\u53f0',
  cardManagement: '\u540d\u7247\u7ba1\u7406',
  visitRecords: '\u6d4f\u89c8\u8bb0\u5f55',
  exchangeRecords: '\u4ea4\u6362\u8bb0\u5f55',
  analytics: '\u6570\u636e\u5206\u6790',
  recentVisitors: '\u6700\u8fd1\u8bbf\u5ba2',
  starredContacts: '\u91cd\u70b9\u8054\u7cfb\u4eba',
  viewMore: '\u67e5\u770b\u66f4\u591a',
  noVisitors: '\u6682\u65e0\u8bbf\u5ba2\u8bb0\u5f55',
  noContacts: '\u6682\u65e0\u91cd\u70b9\u8054\u7cfb\u4eba',
  defaultBadge: '\u9ed8\u8ba4',
  defaultRole: '\u8bf7\u5148\u521b\u5efa\u4e00\u5f20\u9ed8\u8ba4\u540d\u7247',
  defaultName: '\u672a\u547d\u540d\u540d\u7247',
  weeklyViews: '\u672c\u5468\u8bbf\u5ba2',
  visitorsUnit: '\u4eba',
  loadFailed: '\u5de5\u4f5c\u53f0\u52a0\u8f7d\u5931\u8d25',
  newVisitor: '\u65b0\u8bbf\u5ba2',
  justNow: '\u521a\u521a',
  qrCode: 'QR',
  opcWorkbench: 'OPC WORKBENCH'
}

function toText(value, fallback = '') {
  return value === undefined || value === null ? fallback : String(value)
}

function firstChar(name) {
  const text = toText(name).trim()
  return text ? text.slice(0, 1) : '\u8bbf'
}

function buildQuickActions() {
  return [
    { key: 'cards', label: TEXT.cardManagement, iconText: '\u540d', action: 'goToMyCards' },
    { key: 'visitors', label: TEXT.visitRecords, iconText: '\u8bbf', action: 'goToVisitors' },
    { key: 'contacts', label: TEXT.exchangeRecords, iconText: '\u4ea4', action: 'goToContacts' },
    { key: 'analytics', label: TEXT.analytics, iconText: '\u6570', action: 'goToAnalytics' }
  ]
}

Page({
  data: {
    labels: TEXT,
    defaultCard: null,
    displayCardName: TEXT.defaultName,
    displayCardRole: TEXT.defaultRole,
    displayCardCompany: '',
    quickActions: buildQuickActions(),
    recentVisitors: [],
    starredContacts: [],
    personaTags: [],
    weeklyViews: 0,
    visitorCount: 0
  },

  onLoad() {
    this.loadWorkbench()
  },

  onShow() {
    this.loadWorkbench()
  },

  async loadWorkbench() {
    try {
      await bootstrapSessionAsync()
      const result = await getWorkbenchAsync()
      const defaultCard = result.defaultCard || null
      const recentVisitors = Array.isArray(result.recentVisitors)
        ? result.recentVisitors.slice(0, 3).map((item) => ({
            id: toText(item._id || item.id),
            name: toText(item.name, TEXT.newVisitor),
            time: toText(item.visitTimeText || item.time, TEXT.justNow),
            avatarText: firstChar(item.name)
          }))
        : []
      const starredContacts = Array.isArray(result.starredContacts)
        ? result.starredContacts.slice(0, 3).map((item) => ({
            id: toText(item._id || item.id),
            name: toText(item.name, '\u8054\u7cfb\u4eba'),
            role: [toText(item.role), toText(item.company)].filter(Boolean).join(' / '),
            avatarUrl: toText(item.avatarUrl),
            avatarText: firstChar(item.name)
          }))
        : []

      this.setData({
        defaultCard,
        displayCardName: defaultCard ? toText(defaultCard.name, TEXT.defaultName) : TEXT.defaultName,
        displayCardRole: defaultCard ? toText(defaultCard.role, TEXT.defaultRole) : TEXT.defaultRole,
        displayCardCompany: defaultCard ? toText(defaultCard.company) : '',
        weeklyViews: Number(result.weeklyViews || 0),
        visitorCount: Number(result.visitorCount || 0),
        personaTags: Array.isArray(result.personaTags) ? result.personaTags : [],
        starredContacts,
        recentVisitors,
        quickActions: buildQuickActions()
      })
    } catch (error) {
      console.error('load workbench failed:', error)
      this.setData({
        defaultCard: null,
        displayCardName: TEXT.defaultName,
        displayCardRole: TEXT.defaultRole,
        displayCardCompany: '',
        quickActions: buildQuickActions(),
        recentVisitors: [],
        starredContacts: [],
        personaTags: [],
        weeklyViews: 0,
        visitorCount: 0
      })
      wx.showToast({
        title: error && error.message ? error.message : TEXT.loadFailed,
        icon: 'none'
      })
    }
  },

  handleQuickAction(e) {
    const action = e.currentTarget.dataset.action
    if (action && typeof this[action] === 'function') {
      this[action]()
    }
  },

  editDefaultCard() {
    const id = this.data.defaultCard && (this.data.defaultCard.id || this.data.defaultCard._id)
      ? (this.data.defaultCard.id || this.data.defaultCard._id)
      : ''
    wx.navigateTo({ url: `/pages/edit/edit${id ? `?id=${id}` : ''}` })
  },

  showQR(e) {
    if (e && e.stopPropagation) e.stopPropagation()
    const id = this.data.defaultCard && (this.data.defaultCard.id || this.data.defaultCard._id)
      ? (this.data.defaultCard.id || this.data.defaultCard._id)
      : ''
    wx.navigateTo({ url: `/pages/qrcode/qrcode${id ? `?id=${id}` : ''}` })
  },

  goToMyCards() {
    wx.switchTab({ url: '/pages/mycards/mycards' })
  },

  goToVisitors() {
    wx.navigateTo({ url: '/pages/visitor/visitor' })
  },

  goToContacts() {
    wx.switchTab({ url: '/pages/contacts/contacts' })
  },

  goToAnalytics() {
    wx.navigateTo({ url: '/pages/analytics/analytics' })
  }
})