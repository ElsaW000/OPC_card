const {
  getCardsAsync,
  setDefaultCardAsync,
  deleteCardAsync,
} = require('../../services/cardService')
const { bootstrapSessionAsync } = require('../../services/userService')

const TEXT = {
  title: '\u6211\u7684\u540d\u7247',
  subtitle: 'MULTI-IDENTITY MANAGEMENT',
  defaultBadge: '\u9ed8\u8ba4',
  currentDefault: '\u5f53\u524d\u9ed8\u8ba4',
  setDefault: '\u8bbe\u4e3a\u9ed8\u8ba4',
  edit: '\u7f16\u8f91',
  share: '\u4e8c\u7ef4\u7801',
  addIdentity: '\u521b\u5efa\u65b0\u8eab\u4efd',
  shareTitleFallback: '\u6211\u7684 OPC \u540d\u7247',
  sharePathFallback: '/pages/mycards/mycards',
  defaultSaved: '\u5df2\u8bbe\u4e3a\u9ed8\u8ba4',
  keepOne: '\u81f3\u5c11\u4fdd\u7559\u4e00\u5f20',
  deleteTitle: '\u786e\u8ba4\u5220\u9664',
  deleteContent: '\u5220\u9664\u540e\u65e0\u6cd5\u6062\u590d',
  deleted: '\u5df2\u5220\u9664',
  loadFailed: '\u540d\u7247\u52a0\u8f7d\u5931\u8d25',
  saveFailed: '\u8bbe\u7f6e\u9ed8\u8ba4\u5931\u8d25',
  deleteFailed: '\u5220\u9664\u5931\u8d25',
}

function normalizeCard(item = {}) {
  return {
    ...item,
    id: item.id || item._id || '',
    _id: item._id || item.id || '',
    typeIcon: item.typeIcon || 'card',
    title: item.title || TEXT.shareTitleFallback,
    role: item.role || '',
    company: item.company || '',
    bannerUrl: item.bannerUrl || '',
    avatarUrl: item.avatarUrl || '',
    isDefault: !!item.isDefault,
  }
}

Page({
  data: {
    cards: [],
    labels: TEXT,
  },

  onLoad() {
    this.loadCards()
  },

  onShow() {
    this.loadCards()
  },

  async loadCards() {
    try {
      await bootstrapSessionAsync()
      const result = await getCardsAsync()
      const cards = Array.isArray(result.data)
        ? result.data.map(normalizeCard)
        : []
      this.setData({ cards })
    } catch (error) {
      console.error('load cards failed:', error)
      wx.showToast({
        title: error && error.message ? error.message : TEXT.loadFailed,
        icon: 'none',
      })
    }
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/cardDetail/cardDetail?id=' + id })
  },

  editCard(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/edit/edit?id=' + id })
  },

  stopPropagation() {},

  showQRCode(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/qrcode/qrcode?id=' + id })
  },

  async setDefault(e) {
    const id = e.currentTarget.dataset.id
    try {
      await bootstrapSessionAsync()
      await setDefaultCardAsync(id)
      const cards = (this.data.cards || []).map((item) => normalizeCard({
        ...item,
        isDefault: String(item.id) === String(id)
      }))
      this.setData({ cards })
      wx.showToast({ title: TEXT.defaultSaved, icon: 'success' })
    } catch (error) {
      console.error('set default failed:', error)
      wx.showToast({
        title: error && error.message ? error.message : TEXT.saveFailed,
        icon: 'none',
      })
    }
  },

  onShareAppMessage(res) {
    const targetId = res && res.target && res.target.dataset ? res.target.dataset.id : ''
    const card = (this.data.cards || []).find((item) => String(item.id) === String(targetId))
      || (this.data.cards || []).find((item) => item.isDefault)
      || (this.data.cards || [])[0]
    const cardId = card && card.id ? card.id : ''
    const title = card && card.name
      ? `${card.name} - ${card.role || TEXT.shareTitleFallback}`
      : TEXT.shareTitleFallback
    return {
      title,
      path: cardId ? `/pages/cardDetail/cardDetail?id=${cardId}&view=public` : TEXT.sharePathFallback,
      imageUrl: card && card.bannerUrl ? card.bannerUrl : (card && card.avatarUrl ? card.avatarUrl : ''),
    }
  },

  deleteCard(e) {
    const id = e.currentTarget.dataset.id
    if (this.data.cards.length <= 1) {
      wx.showToast({ title: TEXT.keepOne, icon: 'none' })
      return
    }

    wx.showModal({
      title: TEXT.deleteTitle,
      content: TEXT.deleteContent,
      success: async (res) => {
        if (!res.confirm) {
          return
        }
        try {
          await bootstrapSessionAsync()
          await deleteCardAsync(id)
          await this.loadCards()
          wx.showToast({ title: TEXT.deleted, icon: 'success' })
        } catch (error) {
          console.error('delete card failed:', error)
          wx.showToast({
            title: error && error.message ? error.message : TEXT.deleteFailed,
            icon: 'none',
          })
        }
      }
    })
  },

  addCard() {
    wx.navigateTo({ url: '/pages/edit/edit' })
  }
})