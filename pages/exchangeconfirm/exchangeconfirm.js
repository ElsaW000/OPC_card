const { getCardViewAsync } = require('../../services/cardService')
const { createExchangeRequestAsync } = require('../../services/contactService')
const { bootstrapSessionAsync } = require('../../services/userService')
const { getErrorMessage } = require('../../services/errorUtils')

function normalizeText(value, fallback = '') {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

function buildSafePreviewCard(card = {}) {
  return {
    _id: normalizeText(card._id || card.id),
    name: normalizeText(card.name, '\u9648\u5c0f\u72ec\u7acb'),
    role: normalizeText(card.role, 'eSeat \u521b\u59cb\u4eba / \u5168\u6808\u5de5\u7a0b\u5e08'),
    company: normalizeText(card.company, 'ONE PERSON COMPANY'),
    avatarUrl: normalizeText(card.avatarUrl, 'https://images.unsplash.com/photo-1701463387028-3947648f1337?w=400'),
    bannerUrl: normalizeText(card.bannerUrl, 'https://images.unsplash.com/photo-1647247743538-0137d6a8a268?w=800')
  }
}

Page({
  data: {
    loading: false,
    cardId: '',
    card: buildSafePreviewCard()
  },

  async onLoad(options) {
    const cardId = options && options.id ? options.id : ''
    this.setData({ cardId })
    if (cardId) {
      await this.loadCard(cardId)
    }
  },

  async loadCard(cardId) {
    wx.showLoading({ title: '\u52a0\u8f7d\u4e2d...' })
    try {
      await bootstrapSessionAsync()
      const result = await getCardViewAsync(cardId)
      wx.hideLoading()
      if (result && result.success && result.data) {
        this.setData({ card: buildSafePreviewCard(result.data) })
        return
      }
      wx.showToast({ title: '\u52a0\u8f7d\u5931\u8d25', icon: 'none' })
    } catch (error) {
      wx.hideLoading()
      console.error('load exchange preview failed:', error)
      wx.showToast({ title: getErrorMessage(error, '\u52a0\u8f7d\u5931\u8d25').slice(0, 20), icon: 'none' })
    }
  },

  async confirmExchange() {
    if (this.data.loading) {
      return
    }

    const targetCardId = this.data.card._id || this.data.cardId
    if (!targetCardId) {
      wx.showToast({ title: '\u540d\u7247\u4e0d\u5b58\u5728', icon: 'none' })
      return
    }

    this.setData({ loading: true })
    wx.showLoading({ title: '\u4ea4\u6362\u4e2d...' })
    try {
      const result = await createExchangeRequestAsync(targetCardId)
      wx.hideLoading()
      this.setData({ loading: false })
      if (!result.success) {
        wx.showToast({ title: getErrorMessage(result.error, '\u4ea4\u6362\u5931\u8d25').slice(0, 20), icon: 'none' })
        return
      }
      wx.showToast({ title: '\u4ea4\u6362\u8bf7\u6c42\u5df2\u53d1\u9001', icon: 'success' })
      setTimeout(() => {
        wx.switchTab({ url: '/pages/contacts/contacts' })
      }, 1200)
    } catch (error) {
      wx.hideLoading()
      this.setData({ loading: false })
      console.error('confirm exchange failed:', error)
      wx.showToast({ title: getErrorMessage(error, '\u4ea4\u6362\u5931\u8d25').slice(0, 20), icon: 'none' })
    }
  },

  cancelExchange() {
    wx.navigateBack()
  }
})