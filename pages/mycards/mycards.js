const {
  getCardsAsync,
  setDefaultCardAsync,
  deleteCardAsync,
} = require('../../services/cardService')
const { bootstrapSessionAsync } = require('../../services/userService')

const TEXT = {
  defaultSaved: '\u5df2\u8bbe\u4e3a\u9ed8\u8ba4',
  keepOne: '\u81f3\u5c11\u4fdd\u7559\u4e00\u5f20',
  deleteTitle: '\u786e\u8ba4\u5220\u9664',
  deleteContent: '\u5220\u9664\u540e\u65e0\u6cd5\u6062\u590d',
  deleted: '\u5df2\u5220\u9664',
  loadFailed: '\u540d\u7247\u52a0\u8f7d\u5931\u8d25',
  saveFailed: '\u8bbe\u7f6e\u9ed8\u8ba4\u5931\u8d25',
  deleteFailed: '\u5220\u9664\u5931\u8d25',
}

Page({
  data: {
    cards: [],
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
      this.setData({
        cards: Array.isArray(result.data) ? result.data : [],
      })
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
      await this.loadCards()
      wx.showToast({ title: TEXT.defaultSaved, icon: 'success' })
    } catch (error) {
      console.error('set default failed:', error)
      wx.showToast({
        title: error && error.message ? error.message : TEXT.saveFailed,
        icon: 'none',
      })
    }
  },

  shareCard() {
    wx.showShareMenu({ withShareTicket: true })
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
