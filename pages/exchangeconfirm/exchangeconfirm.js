const cardService = require('../../services/cardService')
const contactService = require('../../services/contactService')
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
    role: normalizeText(card.role, 'OPC \u521b\u59cb\u4eba / \u5168\u6808\u5de5\u7a0b\u5e08'),
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

  onLoad(options) {
    const cardId = options && options.id ? options.id : ''
    this.setData({ cardId })
    if (cardId) {
      this.loadCard(cardId)
    }
  },

  loadCard(cardId) {
    wx.showLoading({ title: '\u52a0\u8f7d\u4e2d...' })
    try {
      const result = cardService.getCardView(cardId, '\u4ea4\u6362\u9875\u9884\u89c8', false)
      wx.hideLoading()
      if (!result.success) {
        wx.showToast({ title: getErrorMessage(result.error, '\u52a0\u8f7d\u5931\u8d25').slice(0, 20), icon: 'none' })
        return
      }
      this.setData({ card: buildSafePreviewCard(result.data) })
    } catch (error) {
      wx.hideLoading()
      console.error('load exchange preview failed:', error)
      wx.showToast({ title: getErrorMessage(error, '\u52a0\u8f7d\u5931\u8d25').slice(0, 20), icon: 'none' })
    }
  },

  confirmExchange() {
    const targetCardId = this.data.card._id || this.data.cardId
    if (!targetCardId) {
      wx.showToast({ title: '\u540d\u7247\u4e0d\u5b58\u5728', icon: 'none' })
      return
    }

    this.setData({ loading: true })
    wx.showLoading({ title: '\u4ea4\u6362\u4e2d...' })
    const cardResult = cardService.getCard(targetCardId)
    if (!cardResult.success || !cardResult.data) {
      wx.hideLoading()
      this.setData({ loading: false })
      wx.showToast({ title: '\u4ea4\u6362\u5931\u8d25', icon: 'none' })
      return
    }

    const result = contactService.createExchangeRequest(cardResult.data)
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
  },

  cancelExchange() {
    wx.navigateBack()
  }
})