const { getCardViewAsync } = require('../../services/cardService')
const { bootstrapSessionAsync } = require('../../services/userService')

const TEXT = {
  title: '\u540d\u7247\u4e8c\u7ef4\u7801',
  subtitle: '\u626b\u7801\u6216\u5206\u4eab\u8fd9\u5f20\u540d\u7247',
  fallbackName: '\u6211\u7684 OPC \u540d\u7247',
  fallbackRole: '\u6b22\u8fce\u4e0e\u6211\u4ea4\u6362\u540d\u7247',
  share: '\u5206\u4eab\u540d\u7247',
  copy: '\u590d\u5236\u9875\u9762\u8def\u5f84',
  copied: '\u5df2\u590d\u5236',
}

function buildFakeQrCells(seed = '') {
  const base = String(seed || 'opc-card')
  return Array.from({ length: 121 }).map((_, index) => {
    const code = base.charCodeAt(index % base.length) || 0
    return {
      id: `cell-${index}`,
      active: ((code + index * 7) % 3) !== 0,
    }
  })
}

Page({
  data: {
    labels: TEXT,
    card: null,
    sharePath: '',
    qrCells: buildFakeQrCells(),
  },

  async onLoad(options) {
    const cardId = options && options.id ? options.id : ''
    const sharePath = cardId ? `/pages/cardDetail/cardDetail?id=${cardId}` : '/pages/mycards/mycards'
    this.setData({
      sharePath,
      qrCells: buildFakeQrCells(sharePath),
    })

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

  copyPath() {
    wx.setClipboardData({
      data: this.data.sharePath || '/pages/mycards/mycards',
      success: () => {
        wx.showToast({ title: TEXT.copied, icon: 'success' })
      }
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