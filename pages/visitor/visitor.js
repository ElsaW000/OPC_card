const { getVisitorsAsync } = require('../../services/visitorService')
const { bootstrapSessionAsync } = require('../../services/userService')

const TEXT = {
  all: 'all',
  today: 'today',
  week: 'week',
  title: '\u8bbf\u5ba2\u8bb0\u5f55',
  subtitle: 'Who Viewed My Card',
  tabAll: '\u5168\u90e8',
  tabToday: '\u4eca\u65e5',
  tabWeek: '\u672c\u5468',
  sourcePrefix: '\u6765\u81ea\uff1a',
  exchange: '\u4ea4\u6362',
  empty: '\u6682\u65e0\u8bbf\u5ba2\u8bb0\u5f55',
  loadFailed: '\u8bbf\u5ba2\u8bb0\u5f55\u52a0\u8f7d\u5931\u8d25',
  fallbackName: '\u65b0\u8bbf\u5ba2',
  fallbackRole: '\u540d\u7247\u8bbf\u5ba2',
  fallbackTime: '\u521a\u521a',
  fallbackSource: '\u540d\u7247\u5206\u4eab'
}

function toText(value, fallback = '') {
  return value === undefined || value === null ? fallback : String(value)
}

function normalizeVisitor(item = {}) {
  return {
    id: toText(item._id || item.id),
    name: toText(item.name, TEXT.fallbackName),
    role: toText(item.role, TEXT.fallbackRole),
    avatarUrl: toText(item.avatarUrl),
    viewTime: toText(item.visitTimeText || item.viewTime, TEXT.fallbackTime),
    source: toText(item.source, TEXT.fallbackSource),
    visitDate: toText(item.visitDate)
  }
}

function isToday(isoText) {
  if (!isoText) return false
  const date = new Date(isoText)
  const now = new Date()
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate()
}

function isThisWeek(isoText) {
  if (!isoText) return false
  const date = new Date(isoText)
  const now = new Date()
  const start = new Date(now)
  const day = start.getDay() || 7
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - day + 1)
  return date >= start
}

Page({
  data: {
    labels: TEXT,
    currentTab: TEXT.all,
    visitors: [],
    allVisitors: []
  },

  onLoad() {
    this.loadVisitors()
  },

  onShow() {
    this.loadVisitors()
  },

  async loadVisitors() {
    try {
      await bootstrapSessionAsync()
      const result = await getVisitorsAsync()
      const allVisitors = (result.visitors || []).map(normalizeVisitor)
      this.setData({ allVisitors })
      this.applyFilter(this.data.currentTab)
    } catch (error) {
      console.error('load visitors failed:', error)
      wx.showToast({
        title: error && error.message ? error.message : TEXT.loadFailed,
        icon: 'none'
      })
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab || TEXT.all
    this.applyFilter(tab)
  },

  applyFilter(tab) {
    const source = Array.isArray(this.data.allVisitors) ? this.data.allVisitors : []
    let visitors = source
    if (tab === TEXT.today) {
      visitors = source.filter((item) => isToday(item.visitDate))
    } else if (tab === TEXT.week) {
      visitors = source.filter((item) => isThisWeek(item.visitDate))
    }
    this.setData({ currentTab: tab, visitors })
  },

  exchangeCard(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/exchangeconfirm/exchangeconfirm?id=${id}`
    })
  }
})