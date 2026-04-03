const { readDatabase, updateDatabase, nowIso, uid } = require('./mockDatabase')
const { getCurrentUser, getAuthenticatedRemoteUser, hasAuthenticatedRemoteSession } = require('./userService')
const { isRemoteApiEnabled, allowsLocalMockFallback } = require('./apiConfig')
const { request } = require('./httpClient')

const TEXT = {
  all: '全部',
  missingContact: '联系人不存在',
  justSent: '已发送交换请求',
  approved: '已通过交换请求',
  rejected: '已拒绝交换请求'
}

const UPDATE_TYPES = ['projects', 'videos']

function canUseProtectedRemoteApi() {
  if (!isRemoteApiEnabled()) return false
  if (typeof hasAuthenticatedRemoteSession === 'function') {
    return !!hasAuthenticatedRemoteSession()
  }
  const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null
  return !!(user && user.userId)
}

function getProtectedRemoteUser() {
  if (typeof getAuthenticatedRemoteUser === 'function') {
    return getAuthenticatedRemoteUser()
  }
  return typeof getCurrentUser === 'function' ? getCurrentUser() : null
}

function logProtectedRequestSkip(path) {
  try {
    console.info(`[session] skip protected request ${path}: authenticated-remote-session-required`)
  } catch (error) {}
}

function canFallbackToLocalMock() {
  return typeof allowsLocalMockFallback === 'function' ? allowsLocalMockFallback() : true
}

function buildRemoteUnavailableContactsResult() {
  return {
    success: false,
    contacts: [],
    pendingRequests: [],
    updatedTips: [],
    tags: [TEXT.all],
    error: '远程登录未就绪',
    mode: 'remote-unavailable'
  }
}

function buildRemoteUnavailableMutationResult() {
  return {
    success: false,
    error: '远程登录未就绪',
    mode: 'remote-unavailable'
  }
}

function normalizeTagList(contacts) {
  const set = new Set([TEXT.all])
  contacts.forEach((item) => {
    ;(item.tags || []).forEach((tag) => set.add(tag))
  })
  return Array.from(set)
}

function normalizeRemoteContact(contact = {}) {
  return {
    _id: contact._id,
    cardId: contact.cardId || contact.card_id || '',
    name: contact.name || '联系人',
    role: contact.role || '',
    company: contact.company || '',
    phone: contact.phone || '',
    email: contact.email || '',
    wechat: contact.wechat || '',
    avatarUrl: contact.avatarUrl || '',
    bannerUrl: contact.bannerUrl || '',
    bio: contact.bio || '',
    tags: Array.isArray(contact.tags) ? contact.tags : [],
    starred: !!contact.starred,
    hasUpdate: !!contact.hasUpdate,
    updateType: contact.updateType || '',
    updateMessage: contact.updateMessage || '',
    status: contact.status || 'active',
    latestInteractionText: contact.latestInteractionText || '',
    note: contact.note || ''
  }
}

function getContacts() {
  const user = getCurrentUser()
  const db = readDatabase()
  const contacts = db.contacts.filter((item) => item.ownerUserId === user.userId)
  const pendingRequests = contacts.filter((item) => item.status === 'pending')
  const activeContacts = contacts.filter((item) => item.status !== 'pending' && item.status !== 'rejected')
  const updatedTips = activeContacts.filter((item) => item.hasUpdate && UPDATE_TYPES.includes(item.updateType))
  return {
    success: true,
    contacts: activeContacts,
    pendingRequests,
    updatedTips,
    tags: normalizeTagList(activeContacts),
    mode: 'local-storage'
  }
}

async function getContactsAsync() {
  if (!canUseProtectedRemoteApi()) {
    logProtectedRequestSkip('/contacts')
    if (isRemoteApiEnabled() && !canFallbackToLocalMock()) {
      return buildRemoteUnavailableContactsResult()
    }
    return getContacts()
  }
  const user = getProtectedRemoteUser()
  if (!user || !user.userId) {
    logProtectedRequestSkip('/contacts')
    if (isRemoteApiEnabled() && !canFallbackToLocalMock()) {
      return buildRemoteUnavailableContactsResult()
    }
    return getContacts()
  }
  const result = await request({ url: '/contacts', method: 'GET', userId: user.userId })
  const contacts = (result.contacts || []).map(normalizeRemoteContact)
  const pendingRequests = (result.pendingRequests || []).map(normalizeRemoteContact)
  const updatedTips = (result.updatedTips || []).map(normalizeRemoteContact)
  return {
    success: true,
    contacts,
    pendingRequests,
    updatedTips,
    tags: result.tags || normalizeTagList(contacts),
    mode: 'remote-api'
  }
}

function getContactDetail(contactId) {
  const user = getCurrentUser()
  const db = readDatabase()
  const contact = db.contacts.find((item) => item._id === contactId && item.ownerUserId === user.userId)
  return {
    success: !!contact,
    data: contact ? {
      ...contact,
      cardId: contact.cardId || contact.target_card_id || contact.targetCardId || contact.source_card_id || contact.sourceCardId || ''
    } : null,
    error: contact ? '' : TEXT.missingContact,
    mode: 'local-storage'
  }
}

async function getContactDetailAsync(contactId) {
  if (!isRemoteApiEnabled()) {
    return getContactDetail(contactId)
  }

  const result = await getContactsAsync()
  const allContacts = []
    .concat(Array.isArray(result.contacts) ? result.contacts : [])
    .concat(Array.isArray(result.pendingRequests) ? result.pendingRequests : [])
    .concat(Array.isArray(result.updatedTips) ? result.updatedTips : [])

  const contact = allContacts.find((item) => item && item._id === contactId)
  return {
    success: !!contact,
    data: contact || null,
    error: contact ? '' : TEXT.missingContact,
    mode: 'remote-api'
  }
}

function updateContact(contactId, action, note = '') {
  const user = getCurrentUser()
  updateDatabase((db) => {
    db.contacts = db.contacts.map((item) => {
      if (item._id !== contactId || item.ownerUserId !== user.userId) {
        return item
      }

      if (action === 'toggleStar') {
        return { ...item, starred: !item.starred, updatedAt: nowIso() }
      }
      if (action === 'approveRequest') {
        return { ...item, status: 'active', latestInteractionText: TEXT.approved, updatedAt: nowIso() }
      }
      if (action === 'rejectRequest') {
        return { ...item, status: 'rejected', latestInteractionText: TEXT.rejected, updatedAt: nowIso() }
      }
      if (action === 'saveNote') {
        return { ...item, note, updatedAt: nowIso() }
      }
      return item
    })
    return db
  })

  return { success: true, mode: 'local-storage' }
}

async function updateContactAsync(contactId, action, note = '') {
  if (!canUseProtectedRemoteApi()) {
    if (isRemoteApiEnabled() && !canFallbackToLocalMock()) {
      return buildRemoteUnavailableMutationResult()
    }
    return updateContact(contactId, action, note)
  }
  const user = getProtectedRemoteUser()
  if (!user || !user.userId) {
    if (isRemoteApiEnabled() && !canFallbackToLocalMock()) {
      return buildRemoteUnavailableMutationResult()
    }
    return updateContact(contactId, action, note)
  }
  if (action === 'toggleStar') {
    await request({ url: `/contacts/${contactId}/star`, method: 'POST', userId: user.userId })
    return { success: true, mode: 'remote-api' }
  }
  return { success: false, error: '该操作的远程接口尚未接通', mode: 'remote-api' }
}

function createExchangeRequest(targetCardId) {
  const user = getCurrentUser()
  updateDatabase((db) => {
    db.contacts.unshift({
      _id: uid('contact'),
      ownerUserId: user.userId,
      contactUserId: `pending_${targetCardId}`,
      cardId: targetCardId,
      name: '\u5f85\u786e\u8ba4',
      role: '',
      company: '',
      phone: '',
      email: '',
      wechat: '',
      avatarUrl: '',
      bannerUrl: '',
      bio: '',
      tags: [],
      starred: false,
      hasUpdate: false,
      updateType: '',
      updateMessage: '',
      status: 'pending_sent',
      latestInteractionText: TEXT.justSent,
      createdAt: nowIso(),
      updatedAt: nowIso()
    })
    return db
  })
  return { success: true, mode: 'local-storage' }
}

async function createExchangeRequestAsync(targetCardId) {
  if (!canUseProtectedRemoteApi()) {
    if (isRemoteApiEnabled() && !canFallbackToLocalMock()) {
      return buildRemoteUnavailableMutationResult()
    }
    return createExchangeRequest(targetCardId)
  }
  const user = getProtectedRemoteUser()
  if (!user || !user.userId) {
    if (isRemoteApiEnabled() && !canFallbackToLocalMock()) {
      return buildRemoteUnavailableMutationResult()
    }
    return createExchangeRequest(targetCardId)
  }
  const result = await request({
    url: '/contacts/exchange-request',
    method: 'POST',
    userId: user.userId,
    data: { target_card_id: targetCardId }
  })
  return { success: true, data: result, mode: 'remote-api' }
}

async function approveContactAsync(contactId) {
  if (!canUseProtectedRemoteApi()) {
    if (isRemoteApiEnabled() && !canFallbackToLocalMock()) {
      return buildRemoteUnavailableMutationResult()
    }
    return updateContact(contactId, 'approveRequest')
  }
  const user = getProtectedRemoteUser()
  if (!user || !user.userId) {
    if (isRemoteApiEnabled() && !canFallbackToLocalMock()) {
      return buildRemoteUnavailableMutationResult()
    }
    return updateContact(contactId, 'approveRequest')
  }
  await request({ url: `/contacts/${contactId}/approve`, method: 'POST', userId: user.userId })
  return { success: true, mode: 'remote-api' }
}

async function rejectContactAsync(contactId) {
  if (!canUseProtectedRemoteApi()) {
    if (isRemoteApiEnabled() && !allowsLocalMockFallback()) {
      return buildRemoteUnavailableMutationResult()
    }
    return updateContact(contactId, 'rejectRequest')
  }
  const user = getProtectedRemoteUser()
  if (!user || !user.userId) {
    if (isRemoteApiEnabled() && !allowsLocalMockFallback()) {
      return buildRemoteUnavailableMutationResult()
    }
    return updateContact(contactId, 'rejectRequest')
  }
  await request({ url: `/contacts/${contactId}/reject`, method: 'POST', userId: user.userId })
  return { success: true, mode: 'remote-api' }
}

module.exports = {
  getContacts,
  getContactsAsync,
  getContactDetail,
  getContactDetailAsync,
  updateContact,
  updateContactAsync,
  createExchangeRequest,
  createExchangeRequestAsync,
  approveContactAsync,
  rejectContactAsync
}
