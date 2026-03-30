const { getCards, getCardsAsync } = require('./cardService')
const { getVisitors, getVisitorsAsync } = require('./visitorService')
const { getContacts, getContactsAsync } = require('./contactService')
const { readSettings } = require('./settingsService')
const { isRemoteApiEnabled } = require('./apiConfig')
const { getCurrentUser } = require('./userService')
const { request } = require('./httpClient')

const TEXT = {
  ai: 'AI',
  product: '产品',
  react: 'React',
  dev: '开发',
  saas: 'SaaS',
  flutter: 'Flutter',
  efficiency: '效率',
  startup: '创业',
  wechatShare: '微信分享',
  qrVisit: '二维码访问'
}

function buildWeeklyViews(visitors = []) {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  weekStart.setHours(0, 0, 0, 0)

  return visitors.filter((item) => {
    const date = item.visitDate ? new Date(item.visitDate) : null
    return date && !Number.isNaN(date.getTime()) && date >= weekStart
  }).length
}

function addCount(counter, label, increment = 1) {
  if (!label) return
  counter[label] = (counter[label] || 0) + increment
}

function pushTextTags(counter, value) {
  if (!value) return
  String(value)
    .split(/[\u002c\u002f\u007c\uFF0C\u3001\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => addCount(counter, item))
}

function buildPersonaTags(visitors = [], contacts = [], defaultCard = null) {
  const counter = {}

  contacts.forEach((item) => {
    ;(item.tags || []).forEach((tag) => addCount(counter, tag, 2))
    pushTextTags(counter, item.role)
  })

  visitors.forEach((item) => {
    pushTextTags(counter, item.role)
    pushTextTags(counter, item.source)
    pushTextTags(counter, item.location)
  })

  if (defaultCard) {
    pushTextTags(counter, defaultCard.techStack)
    ;(defaultCard.projects || []).forEach((project) => {
      ;(project.tags || []).forEach((tag) => addCount(counter, tag, 2))
    })
    ;(defaultCard.customCards || []).forEach((card) => addCount(counter, card.title, 1))
  }

  const preferredOrder = [
    TEXT.ai,
    TEXT.product,
    TEXT.react,
    TEXT.dev,
    TEXT.saas,
    TEXT.flutter,
    TEXT.efficiency,
    TEXT.startup,
    TEXT.wechatShare,
    TEXT.qrVisit
  ]

  const labels = Object.keys(counter)
    .sort((a, b) => {
      const aPreferred = preferredOrder.indexOf(a)
      const bPreferred = preferredOrder.indexOf(b)
      const aHasPreferred = aPreferred !== -1
      const bHasPreferred = bPreferred !== -1

      if (aHasPreferred || bHasPreferred) {
        if (!aHasPreferred) return 1
        if (!bHasPreferred) return -1
        return aPreferred - bPreferred
      }

      return counter[b] - counter[a]
    })
    .slice(0, 3)

  return labels.map((label, index) => ({
    label,
    size: Math.max(96, Math.min(152, 132 - index * 12))
  }))
}

function getWorkbench() {
  const cardsResult = getCards()
  const visitorsResult = getVisitors()
  const contactsResult = getContacts()
  const settings = readSettings()
  const cards = cardsResult.data || []
  const defaultCard = cardsResult.defaultCard || cards.find((item) => item.isDefault) || cards[0] || null
  const visitors = visitorsResult.visitors || []
  const contacts = contactsResult.contacts || []
  const starredContacts = contacts.filter((item) => item.starred).slice(0, 4)
  const personaTags = buildPersonaTags(visitors, contacts, defaultCard)

  return {
    success: true,
    defaultCard,
    weeklyViews: buildWeeklyViews(visitors),
    personaTags,
    personaSummary: [],
    starredContacts,
    recentVisitors: visitors.slice(0, 3),
    visitorCount: visitors.length,
    settingsSummary: {
      aiTone: settings.aiTone,
      publicDynamics: settings.publicDynamics,
      privacyMode: settings.privacyMode,
      blacklistCount: (settings.blacklist || []).length
    },
    mode: 'local-storage'
  }
}

async function getWorkbenchAsync() {
  if (!isRemoteApiEnabled()) {
    return getWorkbench()
  }
  const user = getCurrentUser()
  const result = await request({ url: '/workbench', method: 'GET', userId: user.userId })
  return {
    success: true,
    defaultCard: result.defaultCard || null,
    weeklyViews: result.weeklyViews || 0,
    personaTags: result.personaTags || [],
    personaSummary: result.personaSummary || [],
    starredContacts: result.starredContacts || [],
    recentVisitors: result.recentVisitors || [],
    visitorCount: result.visitorCount || 0,
    settingsSummary: result.settingsSummary || {
      aiTone: '专业且友好',
      publicDynamics: true,
      privacyMode: '交换后可见',
      blacklistCount: 0
    },
    mode: 'remote-api'
  }
}

module.exports = {
  getWorkbench,
  getWorkbenchAsync
}
