const { getCardsAsync } = require('../../services/cardService')
const { bootstrapSessionAsync } = require('../../services/userService')

const TEXT = {
  giveTab: '\u6211\u8981\u9012\u51fa',
  receiveTab: '\u6211\u8981\u63a5\u6536',
  currentCard: '\u5f53\u524d\u4f7f\u7528\u540d\u7247',
  changeCard: '\u6362\u4e00\u5f20',
  shareToWechat: '\u53d1\u7ed9\u5fae\u4fe1\u597d\u53cb',
  saveQrcode: '\u4fdd\u5b58\u4e8c\u7ef4\u7801',
  receiveTitle: '\u5f00\u59cb\u63a5\u6536\u5bf9\u65b9\u540d\u7247',
  receiveDesc: '\u5bf9\u65b9\u6253\u5f00\u4ed6\u7684\u4e8c\u7ef4\u7801\u540e\uff0c\u4f60\u53ef\u4ee5\u76f4\u63a5\u626b\u63cf\u6216\u8f93\u5165\u4ea4\u6362\u7801\u3002',
  startScan: '\u5f00\u59cb\u626b\u63cf',
  inputCode: '\u8f93\u5165\u4ea4\u6362\u7801',
  codePlaceholder: '\u4f8b\u5982\uff1aOPC-2026-CHEN',
  parseFailed: '\u672a\u8bc6\u522b\u5230\u540d\u7247\u4fe1\u606f',
  scanSuccess: '\u626b\u63cf\u6210\u529f',
  loadFailed: '\u540d\u7247\u52a0\u8f7d\u5931\u8d25',
  defaultName: '\u5f53\u524d\u6682\u65e0\u540d\u7247',
  defaultRole: '\u8bf7\u5148\u521b\u5efa\u4e00\u5f20\u9ed8\u8ba4\u540d\u7247',
  helperTitle: '\u9762\u5bf9\u9762\u4ea4\u6362\u66f4\u9ad8\u6548',
  helperDesc: '\u63a8\u8350\u4f7f\u7528\u5c0f\u7a0b\u5e8f\u4e8c\u7ef4\u7801\u6216\u4ea4\u6362\u7801\u5feb\u901f\u5b8c\u6210\u53cc\u5411\u4ea4\u6362\u3002',
  qrcodeTitle: '\u5f53\u524d\u540d\u7247\u4e8c\u7ef4\u7801',
  qrcodeHint: '\u5c06\u8fd9\u4e2a\u4e8c\u7ef4\u7801\u5c55\u793a\u7ed9\u5bf9\u65b9\u5373\u53ef',
  codeEmpty: '\u8bf7\u8f93\u5165\u4ea4\u6362\u7801'
}

function toText(value, fallback = '') {
  return value === undefined || value === null ? fallback : String(value)
}

function buildFakeQrCells(seed = '') {
  const base = String(seed || 'opc-exchange')
  return Array.from({ length: 121 }).map((_, index) => {
    const code = base.charCodeAt(index % base.length) || 0
    return {
      id: `cell-${index}`,
      active: ((code + index * 5) % 3) !== 0,
    }
  })
}

function buildCard(card = {}) {
  const id = toText(card.id || card._id)
  return {
    id,
    name: toText(card.name, TEXT.defaultName),
    role: toText(card.role, TEXT.defaultRole),
    company: toText(card.company),
    avatarUrl: toText(card.avatarUrl),
    bannerUrl: toText(card.bannerUrl),
    qrCells: buildFakeQrCells(id || card.name || 'opc-card')
  }
}

function extractCardId(raw) {
  const text = toText(raw).trim()
  if (!text) return ''

  const directPath = text.match(/[?&]id=([^&]+)/)
  if (directPath && directPath[1]) {
    return decodeURIComponent(directPath[1])
  }

  const prefixed = text.match(/(?:ES-|CARD-|ID:)([A-Za-z0-9_-]+)/i)
  if (prefixed && prefixed[1]) {
    return prefixed[1]
  }

  if (/^[A-Za-z0-9_-]{6,}$/.test(text)) {
    return text
  }

  return ''
}

Page({
  data: {
    labels: TEXT,
    currentTab: 0,
    currentCard: buildCard(),
    exchangeCode: '',
    giveTabClass: 'active',
    receiveTabClass: '',
    showGivePanel: true,
    showReceivePanel: false
  },

  onLoad(options) {
    this.preselectedCardId = options && options.cardId ? options.cardId : ''
    this.loadCurrentCard()
    this.syncTabState(0)
  },

  syncTabState(index) {
    const currentTab = Number(index || 0)
    this.setData({
      currentTab,
      giveTabClass: currentTab === 0 ? 'active' : '',
      receiveTabClass: currentTab === 1 ? 'active' : '',
      showGivePanel: currentTab === 0,
      showReceivePanel: currentTab === 1
    })
  },

  async loadCurrentCard() {
    try {
      await bootstrapSessionAsync()
      const result = await getCardsAsync()
      const cards = Array.isArray(result.data) ? result.data : []
      const preselected = this.preselectedCardId
        ? cards.find((c) => (c.id || c._id) === this.preselectedCardId)
        : null
      const currentCard = preselected || result.defaultCard || cards[0] || null
      if (currentCard) {
        this.setData({ currentCard: buildCard(currentCard) })
      }
    } catch (error) {
      console.error('load exchange card failed:', error)
      wx.showToast({
        title: error && error.message ? error.message : TEXT.loadFailed,
        icon: 'none'
      })
    }
  },

  switchTab(e) {
    this.syncTabState(e.currentTarget.dataset.index)
  },

  changeCard() {
    wx.switchTab({ url: '/pages/mycards/mycards' })
  },

  saveQrcode() {
    const id = this.data.currentCard && this.data.currentCard.id ? this.data.currentCard.id : ''
    wx.navigateTo({ url: `/pages/qrcode/qrcode${id ? `?id=${id}` : ''}` })
  },

  onExchangeCodeInput(e) {
    this.setData({ exchangeCode: toText(e.detail.value) })
  },

  startScan() {
    wx.scanCode({
      success: (res) => {
        console.log('scan result =', res)
        const cardId = extractCardId(res.result)
        if (!cardId) {
          wx.showToast({ title: TEXT.parseFailed, icon: 'none' })
          return
        }
        wx.showToast({ title: TEXT.scanSuccess, icon: 'success' })
        wx.navigateTo({ url: `/pages/cardDetail/cardDetail?id=${cardId}&visitor=1` })
      },
      fail: (err) => {
        console.error('scan failed:', err)
      }
    })
  },

  submitExchangeCode() {
    const cardId = extractCardId(this.data.exchangeCode)
    if (!cardId) {
      wx.showToast({ title: this.data.exchangeCode ? TEXT.parseFailed : TEXT.codeEmpty, icon: 'none' })
      return
    }
    wx.navigateTo({ url: `/pages/cardDetail/cardDetail?id=${cardId}&visitor=1` })
  },

  onShareAppMessage() {
    const card = this.data.currentCard || {}
    const cardId = card.id || ''
    return {
      title: card.name ? `${card.name} - ${card.role || TEXT.defaultRole}` : TEXT.defaultName,
      path: cardId ? `/pages/cardDetail/cardDetail?id=${cardId}&visitor=1` : '/pages/exchange/exchange',
      imageUrl: card.bannerUrl || card.avatarUrl || ''
    }
  }
})