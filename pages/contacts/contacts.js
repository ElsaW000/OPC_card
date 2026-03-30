const { getContactsAsync, updateContactAsync } = require('../../services/contactService')
const { bootstrapSessionAsync } = require('../../services/userService')

const TEXT = {
  all: '\u5168\u90e8',
  title: '\u8054\u7cfb\u4eba',
  searchPlaceholder: '\u641c\u7d22\u8054\u7cfb\u4eba...',
  recentSection: '\u6700\u8fd1\u4ea4\u6362',
  allSection: '\u5168\u90e8\u8054\u7cfb\u4eba',
  loadFailed: '\u8054\u7cfb\u4eba\u52a0\u8f7d\u5931\u8d25',
  starFailed: '\u661f\u6807\u66f4\u65b0\u5931\u8d25',
  fallbackName: '\u8054\u7cfb\u4eba',
  fallbackTime: '\u6700\u8fd1\u66f4\u65b0',
  starred: '\u2605',
  unstarred: '\u2606',
  searchIcon: '\u641c'
}

function toText(value, fallback = '') {
  return value === undefined || value === null ? fallback : String(value)
}

function normalizeContact(item = {}) {
  const starred = !!item.starred
  return {
    id: toText(item._id || item.id),
    name: toText(item.name, TEXT.fallbackName),
    role: [toText(item.role), toText(item.company)].filter(Boolean).join(' / ') || toText(item.role),
    avatar: toText(item.avatarUrl || item.avatar),
    time: toText(item.latestInteractionText || item.time, TEXT.fallbackTime),
    tags: Array.isArray(item.tags) ? item.tags.map((tag) => toText(tag)).filter(Boolean) : [],
    starred,
    actionText: starred ? TEXT.starred : TEXT.unstarred
  }
}

Page({
  data: {
    labels: {
      title: TEXT.title,
      searchPlaceholder: TEXT.searchPlaceholder,
      searchIcon: TEXT.searchIcon,
      recentSection: TEXT.recentSection,
      allSection: TEXT.allSection
    },
    contacts: [],
    filteredContacts: [],
    recentContacts: [],
    filterTags: [TEXT.all],
    activeTag: TEXT.all,
    searchKeyword: '',
    totalCount: 0
  },

  onLoad() {
    this.loadContacts()
  },

  onShow() {
    this.loadContacts()
  },

  async loadContacts() {
    try {
      await bootstrapSessionAsync()
      const result = await getContactsAsync()
      const contacts = (result.contacts || []).map(normalizeContact)
      const remoteTags = Array.isArray(result.tags)
        ? result.tags.map((tag) => toText(tag)).filter(Boolean)
        : []
      const filterTags = remoteTags.length ? [TEXT.all, ...remoteTags.filter((tag) => tag !== TEXT.all)] : [TEXT.all]

      this.setData({
        contacts,
        recentContacts: contacts.slice(0, 1),
        filterTags,
        totalCount: contacts.length
      })
      this.applyFilters()
    } catch (error) {
      console.error('load contacts failed:', error)
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
      const matchTag = activeTag === TEXT.all || (item.tags || []).includes(activeTag)
      return matchKeyword && matchTag
    })

    this.setData({
      filteredContacts: filtered,
      recentContacts: filtered.slice(0, 1),
      totalCount: filtered.length
    })
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
  }
})