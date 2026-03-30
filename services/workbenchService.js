const { getCards, getCardsAsync } = require('./cardService')
const { getVisitors, getVisitorsAsync } = require('./visitorService')
const { getContacts, getContactsAsync } = require('./contactService')
const { readSettings } = require('./settingsService')
const { isRemoteApiEnabled } = require('./apiConfig')
const { getCurrentUser } = require('./userService')
const { request } = require('./httpClient')

const TEXT = {
  ai: 'AI',
  product: '\u4ea7\u54c1',
  react: 'React',
  dev: '\u5f00\u53d1',
  saas: 'SaaS',
  flutter: 'Flutter',
  efficiency: '\u6548\u7387',
  startup: '\u521b\u4e1a',
  wechatShare: '\u5fae\u4fe1\u5206\u4eab',
  qrVisit: '\u4e8c\u7ef4\u7801\u8bbf\u95ee'
}

function normalizeDefaultCard(card = null) {
  if (!card) return null
  return {
    _id: card._id || card.id || '',
    id: card.id || card._id || '',
    name: card.name || '',
    role: card.role || '',
    company: card.company || '',
    bannerUrl: card.bannerUrl || card.banner_url || '',
    avatarUrl: card.avatarUrl || card.avatar_url || '',
    techStack: card.techStack || card.tech_stack || '',
    projects: Array.isArray(card.projects) ? card.projects : [],
    customCards: Array.isArray(card.customCards) ? card.customCards : []
  }
}

function normalizeContact(contact = {}) {
  return {
    _id: contact._id || contact.id || '',
    id: contact.id || contact._id || '',
    name: contact.name || '\u8054\u7cfb\u4eba',
    role: contact.role || '',
    company: contact.company || '',
    avatarUrl: contact.avatarUrl || contact.avatar_url || '',
    latestInteractionText: contact.latestInteractionText || '',
    starred: !!contact.starred,
    tags: Array.isArray(contact.tags) ? contact.tags : []
  }
}

function normalizeVisitor(visitor = {}) {
  return {
    _id: visitor._id || visitor.id || '',
    id: visitor.id || visitor._id || '',
    name: visitor.name || '\u65b0\u8bbf\u5ba2',
    role: visitor.role || '\u540d\u7247\u8bbf\u5ba2',
    avatarUrl: visitor.avatarUrl || visitor.avatar_url || '',
    source: visitor.source || '\u540d\u7247\u5206\u4eab',
    location: visitor.location || '',
    visitDate: visitor.visitDate || '',
    visitTimeText: visitor.visitTimeText || '\u521a\u521a',
    visitCount: Number(visitor.visitCount || 1)
  }
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
  const defaultCard = normalizeDefaultCard(cardsResult.defaultCard || cards.find((item) => item.isDefault) || cards[0] || null)
  const visitors = (visitorsResult.visitors || []).map(normalizeVisitor)
  const contacts = (contactsResult.contacts || []).map(normalizeContact)
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
    defaultCard: normalizeDefaultCard(result.defaultCard || null),
    weeklyViews: Number(result.weeklyViews || 0),
    visitorCount: Number(result.visitorCount || 0),
    personaTags: Array.isArray(result.personaTags) ? result.personaTags : [],
    personaSummary: Array.isArray(result.personaSummary) ? result.personaSummary : [],
    starredContacts: Array.isArray(result.starredContacts) ? result.starredContacts.map(normalizeContact) : [],
    recentVisitors: Array.isArray(result.recentVisitors) ? result.recentVisitors.map(normalizeVisitor) : [],
    settingsSummary: result.settingsSummary || {
      aiTone: '\u4e13\u4e1a\u4e14\u53cb\u597d',
      publicDynamics: true,
      privacyMode: '\u4ea4\u6362\u540e\u53ef\u89c1',
      blacklistCount: 0
    },
    mode: 'remote-api'
  }
}

module.exports = {
  getWorkbench,
  getWorkbenchAsync
}