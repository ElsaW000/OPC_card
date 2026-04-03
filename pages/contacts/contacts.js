const { getContactsAsync, updateContactAsync, approveContactAsync, rejectContactAsync } = require('../../services/contactService')
const { bootstrapSessionAsync, getSessionState } = require('../../services/userService')

const TEXT = {
  all: '\u5168\u90e8',
  title: '\u8054\u7cfb\u4eba',
  searchPlaceholder: '\u641c\u7d22\u8054\u7cfb\u4eba...',
  pendingSection: '\u5f85\u5904\u7406\u8bf7\u6c42',
  recentSection: '\u6700\u8fd1\u4ea4\u6362',
  allSection: '\u5168\u90e8\u8054\u7cfb\u4eba',
  loadFailed: '\u8054\u7cfb\u4eba\u52a0\u8f7d\u5931\u8d25',
  starFailed: '\u661f\u6807\u66f4\u65b0\u5931\u8d25',
  approveFailed: '\u64cd\u4f5c\u5931\u8d25',
  fallbackName: '\u8054\u7cfb\u4eba',
  fallbackTime: '\u6700\u8fd1\u66f4\u65b0',
  starred: '\u2605',
  unstarred: '\u2606',
  searchIcon: '\u641c',
  approve: '\u540c\u610f',
  reject: '\u62d2\u7edd'
}

function toText(value, fallback = '') {
  return value === undefined || value === null ? fallback : String(value)
}

function normalizeContact(item = {}) {
  const starred = !!item.starred
  return {
    id: toText(item._id || item.id),
    cardId: toText(item.cardId || item.card_id),
    name: toText(item.name, TEXT.fallbackName),
    role: [toText(item.role), toText(item.company)].filter(Boolean).join(' / ') || toText(item.role),
    avatar: toText(item.avatarUrl || item.avatar),
    time: toText(item.latestInteractionText || item.time, TEXT.fallbackTime),
    tags: Array.isArray(item.tags) ? item.tags.map((tag) => toText(tag)).filter(Boolean) : [],
    starred,
    actionText: starred ? TEXT.starred : TEXT.unstarred
  }
}

function normalizeSessionView(sessionState = {}) {
  const status = sessionState.status || 'local_ready'
  if (status === 'remote_ready') {
    return { code: status, tone: 'success', title: '远程已登录', text: sessionState.message || '联系人来自远程接口' }
  }
  if (status === 'remote_unavailable') {
    return { code: status, tone: 'warning', title: '远程不可用', text: sessionState.message || '当前展示本地联系人' }
  }
  return { code: 'local_ready', tone: 'neutral', title: '本地模式', text: sessionState.message || '当前展示本地联系人' }
}

Page({
  data: {
    labels: {
      title: TEXT.title,
      searchPlaceholder: TEXT.searchPlaceholder,
      searchIcon: TEXT.searchIcon,
      pendingSection: TEXT.pendingSection,
      recentSection: TEXT.recentSection,
      allSection: TEXT.allSection,
      approve: TEXT.approve,
      reject: TEXT.reject
    },
    contacts: [],
    pendingRequests: [],
    filteredContacts: [],
    recentContacts: [],
    filterTags: [TEXT.all],
    activeTag: TEXT.all,
    searchKeyword: '',
    totalCount: 0,
    sessionView: normalizeSessionView(getSessionState())
  },

  onLoad(options) {
    const storedFilter = wx.getStorageSync('contacts_initial_filter')
    if (storedFilter) wx.removeStorageSync('contacts_initial_filter')
    const initialFilter = storedFilter === 'starred' || (options && options.filter === 'starred') ? TEXT.starred : TEXT.all
    this.setData({ activeTag: initialFilter })
    this.loadContacts()
  },

  onShow() {
    this.loadContacts()
  },

  async loadContacts() {
    try {
      const session = await bootstrapSessionAsync()
      this.applySessionView(session && session.sessionState)
      const result = await getContactsAsync()
      const contacts = (result.contacts || []).map(normalizeContact)
      const pendingRequests = (result.pendingRequests || []).map(normalizeContact)
      const remoteTags = Array.isArray(result.tags)
        ? result.tags.map((tag) => toText(tag)).filter(Boolean)
        : []
      const filterTags = remoteTags.length ? [TEXT.all, TEXT.starred].concat(remoteTags.filter((tag) => tag !== TEXT.all && tag !== TEXT.starred)) : [TEXT.all, TEXT.starred]

      this.setData({
        contacts,
        pendingRequests,
        recentContacts: contacts.slice(0, 1),
        filterTags,
        totalCount: contacts.length
      })
      this.applyFilters()
    } catch (error) {
      console.error('load contacts failed:', error)
      this.applySessionView(getSessionState())
      wx.showToast({
        title: error && error.message ? error.message : TEXT.loadFailed,
        icon: 'none'
      })
    }
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: toText(e.detail.value) })
    this.applyFilters()
  },

  selectTag(e) {
    const tag = e.currentTarget.dataset.tag || TEXT.all
    this.setData({ activeTag: tag })
    this.applyFilters()
  },

  applyFilters() {
    const keyword = toText(this.data.searchKeyword).trim().toLowerCase()
    const activeTag = this.data.activeTag
    const allContacts = Array.isArray(this.data.contacts) ? this.data.contacts : []
    const filtered = allContacts.filter((item) => {
      const matchKeyword = !keyword || [item.name, item.role, ...(item.tags || [])].join(' ').toLowerCase().includes(keyword)
      const matchTag = activeTag === TEXT.all || (activeTag === TEXT.starred ? item.starred : (item.tags || []).includes(activeTag))
      return matchKeyword && matchTag
    })

    this.setData({
      filteredContacts: filtered,
      recentContacts: filtered.slice(0, 1),
      totalCount: filtered.length
    })
  },

  applySessionView(sessionState) {
    const sessionView = normalizeSessionView(sessionState || getSessionState())
    try {
      console.info(`[session-ui] contacts status=${sessionView.code} text=${sessionView.text}`)
    } catch (error) {}
    this.setData({ sessionView })
  },

  async toggleStar(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return

    try {
      await bootstrapSessionAsync()
      await updateContactAsync(id, 'toggleStar')
      await this.loadContacts()
    } catch (error) {
      console.error('toggle star failed:', error)
      wx.showToast({
        title: error && error.message ? error.message : TEXT.starFailed,
        icon: 'none'
      })
    }
  },

  async approveRequest(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    try {
      await bootstrapSessionAsync()
      await approveContactAsync(id)
      wx.showToast({ title: '\u5df2\u540c\u610f', icon: 'success' })
      await this.loadContacts()
    } catch (error) {
      console.error('approve request failed:', error)
      wx.showToast({ title: TEXT.approveFailed, icon: 'none' })
    }
  },

  async rejectRequest(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    try {
      await bootstrapSessionAsync()
      await rejectContactAsync(id)
      wx.showToast({ title: '\u5df2\u62d2\u7edd', icon: 'none' })
      await this.loadContacts()
    } catch (error) {
      console.error('reject request failed:', error)
      wx.showToast({ title: TEXT.approveFailed, icon: 'none' })
    }
  },

  openContactCard(e) {
    const cardId = e.currentTarget.dataset.cardId || ''
    const contactId = e.currentTarget.dataset.id || ''
    if (cardId) {
      wx.navigateTo({ url: `/pages/cardDetail/cardDetail?id=${cardId}&visitor=1` })
      return
    }
    if (contactId) {
      wx.navigateTo({ url: `/pages/contactdetail/contactdetail?id=${contactId}` })
    }
  }
})
