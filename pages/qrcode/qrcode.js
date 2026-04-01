const { getCardViewAsync } = require('../../services/cardService')
const { bootstrapSessionAsync } = require('../../services/userService')
const { getApiBaseUrl } = require('../../services/apiConfig')

const TEXT = {
  title: '\u540d\u7247\u4e8c\u7ef4\u7801',
  subtitle: '\u626b\u7801\u6216\u5206\u4eab\u8fd9\u5f20\u540d\u7247',
  fallbackName: '\u6211\u7684 eSeat \u540d\u7247',
  fallbackRole: '\u6b22\u8fce\u4e0e\u6211\u4ea4\u6362\u540d\u7247',
  share: '\u5206\u4eab\u540d\u7247',
  copy: '\u590d\u5236\u4ea4\u6362\u7801',
  copied: '\u5df2\u590d\u5236',
  saveImg: '\u4fdd\u5b58\u56fe\u7247',
  saveFailed: '\u4fdd\u5b58\u5931\u8d25',
  saved: '\u5df2\u4fdd\u5b58\u5230\u76f8\u518c',
}

function buildFakeQrCells(seed) {
  const base = String(seed || 'eseat-card')
  return Array.from({ length: 121 }).map((_, index) => {
    const code = base.charCodeAt(index % base.length) || 0
    return { id: `cell-${index}`, active: ((code + index * 7) % 3) !== 0 }
  })
}

Page({
  data: {
    labels: TEXT,
    card: null,
    sharePath: '',
    qrImagePath: '',
    qrCells: buildFakeQrCells(),
    qrLoading: true,
  },

  async onLoad(options) {
    const cardId = options && options.id ? options.id : ''
    const sharePath = cardId ? `/pages/cardDetail/cardDetail?id=${cardId}&visitor=1` : '/pages/mycards/mycards'
    this.setData({ sharePath, qrCells: buildFakeQrCells(sharePath) })

    this.loadQrImage(sharePath)

    try {
      await bootstrapSessionAsync()
      const result = await getCardViewAsync(cardId)
      if (result && result.success && result.data) {
        const name = result.data.name || TEXT.fallbackName
        this.setData({
          card: {
            id: result.data.id || cardId,
            name,
            role: result.data.role || TEXT.fallbackRole,
            avatarUrl: result.data.avatarUrl || '',
            avatarInitial: String(name).slice(0, 1),
          }
        })
        return
      }
    } catch (error) {
      console.error('load qrcode card failed:', error)
    }

    this.setData({
      card: {
        id: cardId,
        name: TEXT.fallbackName,
        role: TEXT.fallbackRole,
        avatarUrl: '',
        avatarInitial: String(TEXT.fallbackName).slice(0, 1),
      }
    })
  },

  loadQrImage(path) {
    const base = getApiBaseUrl().replace('/api/v1', '')
    const url = `${base}/api/v1/qrcode?path=${encodeURIComponent(path)}`
    wx.downloadFile({
      url,
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({ qrImagePath: res.tempFilePath, qrLoading: false })
        } else {
          this.setData({ qrLoading: false })
        }
      },
      fail: () => {
        this.setData({ qrLoading: false })
      }
    })
  },

  saveQrImage() {
    if (!this.data.qrImagePath) {
      wx.showToast({ title: TEXT.saveFailed, icon: 'none' })
      return
    }
    wx.saveImageToPhotosAlbum({
      filePath: this.data.qrImagePath,
      success: () => wx.showToast({ title: TEXT.saved, icon: 'success' }),
      fail: () => wx.showToast({ title: TEXT.saveFailed, icon: 'none' })
    })
  },

  copyPath() {
    const cardId = this.data.card && this.data.card.id ? this.data.card.id : ''
    const exchangeCode = cardId ? `ES-${cardId}` : this.data.sharePath
    wx.setClipboardData({
      data: exchangeCode,
      success: () => wx.showToast({ title: TEXT.copied, icon: 'success' })
    })
  },

  onShareAppMessage() {
    const card = this.data.card || {}
    return {
      title: card.name ? `${card.name} - ${card.role || TEXT.fallbackRole}` : TEXT.fallbackName,
      path: this.data.sharePath || '/pages/mycards/mycards',
    }
  }
})