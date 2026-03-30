const { readDatabase, updateDatabase, nowIso, uid } = require('./mockDatabase')
const { getCurrentUser } = require('./userService')
const { isRemoteApiEnabled } = require('./apiConfig')
const { request } = require('./httpClient')

const TEXT = {
  all: '全部',
  missingContact: '联系人不存在',
  justSent: '已发送交换请求',
  approved: '已通过交换请求',
  rejected: '已拒绝交换请求'
}

const UPDATE_TYPES = ['projects', 'videos']

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
  if (!isRemoteApiEnabled()) {
    return getContacts()
  }
  const user = getCurrentUser()
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
    data: contact || null,
    error: contact ? '' : TEXT.missingContact,
    mode: 'local-storage'
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
  if (!isRemoteApiEnabled()) {
    return updateContact(contactId, action, note)
  }
  const user = getCurrentUser()
  if (action === 'toggleStar') {
    await request({ url: `/contacts/${contactId}/star`, method: 'POST', userId: user.userId })
    return { success: true, mode: 'remote-api' }
  }
  return { success: false, error: '该操作的远程接口尚未接通', mode: 'remote-api' }
}

function createExchangeRequest(targetCard) {
  const user = getCurrentUser()
  updateDatabase((db) => {
    db.contacts.unshift({
      _id: uid('contact'),
      ownerUserId: user.userId,
      contactUserId: `pending_${targetCard._id}`,
      cardId: targetCard._id,
      name: targetCard.name,
      role: targetCard.role,
      company: targetCard.company || '',
      phone: targetCard.phone || '',
      email: targetCard.email || '',
      wechat: targetCard.wechat || '',
      avatarUrl: targetCard.avatarUrl || '',
      bannerUrl: targetCard.bannerUrl || '',
      bio: targetCard.bio || '',
      tags: targetCard.customCards ? targetCard.customCards.map((item) => item.title).filter(Boolean).slice(0, 3) : [],
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

module.exports = {
  getContacts,
  getContactsAsync,
  getContactDetail,
  updateContact,
  updateContactAsync,
  createExchangeRequest
}
