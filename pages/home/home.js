const { getWorkbenchAsync } = require('../../services/workbenchService')
const { bootstrapSessionAsync, getSessionState } = require('../../services/userService')
const { updateSettings, addSuggestion, readSettings } = require('../../services/settingsService')
const { isRemoteApiEnabled, setRemoteApiEnabled, allowsLocalMockFallback } = require('../../services/apiConfig')

const TEXT = {
  aiTitle: 'AI 社交助理',
  aiPlaceholder: '您有什么需求？',
  aiPrompt: '看下最近圈子里有什么新鲜事？',
  modelFree: '标准模型（免费）',
  modelPaid: '增强模型（付费）',
  dataTitle: '数据模块',
  weeklyViews: '每周访问总数字',
  starredTitle: '星标联系人',
  updatedProducts: '更新了新产品',
  updatedVideos: '发布了新视频',
  noContacts: '暂无星标联系人',
  settingsTitle: '系统设置',
  aiTone: 'AI 语聊',
  publicDynamics: '公开动态通知',
  privacySettings: '隐私设置',
  blacklist: '黑名单',
  membership: '会员权益',
  contactUs: '联系我们',
  submit: '提交',
  cancel: '取消',
  suggestionPlaceholder: '输入你的建议或遇到的问题',
  contactPlaceholder: '留下你的联系方式（可选）',
  noPrompt: '请先输入内容',
  saved: '建议已提交',
  saveFailed: '提交失败',
  fallbackContact: '联系人',
  fallbackRole: '暂无标签信息',
  loadFailed: '工作台加载失败'
}

const AI_TONES = [
  '专业且友好',
  '简洁直接',
  '温暖陪伴'
]

const PRIVACY_OPTIONS = [
  '公开可见',
  '交换后可见',
  '仅自己可见'
]

function toText(value, fallback = '') {
  return value === undefined || value === null ? fallback : String(value)
}

function firstChar(name) {
  const text = toText(name).trim()
  return text ? text.slice(0, 1) : '联'
}

function normalizeSettings(settings = {}) {
  return {
    aiTone: toText(settings.aiTone, AI_TONES[0]),
    publicDynamics: settings.publicDynamics !== false,
    privacyMode: toText(settings.privacyMode, PRIVACY_OPTIONS[1]),
    blacklistCount: Number(settings.blacklistCount || (Array.isArray(settings.blacklist) ? settings.blacklist.length : 0) || 0)
  }
}

function normalizePersonaTags(tags = []) {
  const fallback = [
    { label: 'AI', size: 188, emphasis: 'primary' },
    { label: '产品', size: 124, emphasis: 'secondary' },
    { label: 'React', size: 116, emphasis: 'secondary' },
    { label: '潜在客户', size: 94, emphasis: 'normal' },
    { label: '微信好友', size: 86, emphasis: 'normal' },
    { label: '新增访客', size: 82, emphasis: 'normal' }
  ]
  const source = Array.isArray(tags) && tags.length ? tags : fallback

  return source.slice(0, 6).map((item, index) => {
    const label = toText(item.label || item.name || item, 'AI')
    const isAI = /ai/i.test(label)
    const fallbackSize = index === 0 ? 188 : index === 1 ? 124 : index === 2 ? 116 : 88

    return {
      id: `bubble-${index}`,
      label,
      size: Math.max(Number(item.size || 0), isAI ? 188 : fallbackSize),
      tone: index % 4,
      emphasis: isAI ? 'primary' : (index < 3 ? 'secondary' : 'normal')
    }
  })
}

function normalizeStarredContacts(items = []) {
  return (Array.isArray(items) ? items : []).slice(0, 8).map((item, index) => ({
    id: toText(item._id || item.id, `contact-${index}`),
    cardId: toText(item.cardId || item.card_id),
    name: toText(item.name, TEXT.fallbackContact),
    role: [toText(item.role), toText(item.company)].filter(Boolean).join(' / ') || TEXT.fallbackRole,
    avatarUrl: toText(item.avatarUrl),
    avatarText: firstChar(item.name),
    hasUpdate: !!(item.hasUpdate || item.updated || item.updateType),
    updateText: toText(item.updateMessage, item.updateType === 'videos' ? TEXT.updatedVideos : TEXT.updatedProducts)
  }))
}

function isTimeoutError(error) {
  const text = [error && error.message, error && error.errMsg].filter(Boolean).join(' ')
  return /timeout/i.test(text)
}

function canFallbackToLocalMock() {
  return typeof allowsLocalMockFallback === 'function' ? allowsLocalMockFallback() : true
}

function normalizeSessionView(sessionState = {}) {
  const status = sessionState.status || 'local_ready'
  if (status === 'remote_ready') {
    return { code: status, tone: 'success', title: '远程已登录', text: sessionState.message || '远程业务接口已连接' }
  }
  if (status === 'remote_unavailable') {
    return { code: status, tone: 'warning', title: '远程不可用', text: sessionState.message || '当前使用本地数据' }
  }
  return { code: 'local_ready', tone: 'neutral', title: '本地模式', text: sessionState.message || '当前使用本地数据' }
}

Page({
  data: {
    labels: TEXT,
    aiInput: '',
    aiPrompt: TEXT.aiPrompt,
    modelPills: [
      { text: TEXT.modelFree, tone: 'light' },
      { text: TEXT.modelPaid, tone: 'accent' }
    ],
    weeklyViews: 0,
    personaTags: normalizePersonaTags(),
    starredContacts: [],
    settingsSummary: normalizeSettings(readSettings()),
    sessionView: normalizeSessionView(getSessionState()),
    showSuggestionForm: false,
    suggestionContent: '',
    suggestionContact: '',
    aiInputFocused: false
  },

  onLoad() {
    this.loadWorkbench()
  },

  onShow() {
    this.loadWorkbench()
  },

  async loadWorkbench() {
    try {
      const session = await bootstrapSessionAsync()
      this.applySessionView(session && session.sessionState)
      if (session && session.success === false && session.sessionState && session.sessionState.status === 'remote_unavailable') {
        this.setData({
          weeklyViews: 0,
          personaTags: normalizePersonaTags(),
          starredContacts: [],
          settingsSummary: normalizeSettings(readSettings())
        })
        wx.showToast({
          title: session.fallbackReason || session.sessionState.message || TEXT.loadFailed,
          icon: 'none'
        })
        return
      }
      const result = await getWorkbenchAsync()
      this.applyWorkbenchResult(result)
    } catch (error) {
      if (isRemoteApiEnabled() && canFallbackToLocalMock() && isTimeoutError(error)) {
        setRemoteApiEnabled(false)
        try {
          this.applySessionView({ status: 'remote_unavailable', message: '远程接口超时，当前使用本地数据' })
          const result = await getWorkbenchAsync()
          this.applyWorkbenchResult(result)
          wx.showToast({ title: '远程超时，已切换本地模式', icon: 'none' })
          return
        } catch (fallbackError) {
          console.warn('workbench fallback failed:', fallbackError)
        }
      }
      console.warn('load workbench failed:', error)
      this.applySessionView(getSessionState())
      this.setData({
        weeklyViews: 0,
        personaTags: normalizePersonaTags(),
        starredContacts: [],
        settingsSummary: normalizeSettings(readSettings())
      })
      wx.showToast({
        title: error && error.message ? error.message : TEXT.loadFailed,
        icon: 'none'
      })
    }
  },

  applyWorkbenchResult(result = {}) {
    this.setData({
      weeklyViews: Number(result.weeklyViews || 0),
      personaTags: normalizePersonaTags(result.personaTags),
      starredContacts: normalizeStarredContacts(result.starredContacts),
      settingsSummary: normalizeSettings(result.settingsSummary || readSettings())
    })
  },

  applySessionView(sessionState) {
    const sessionView = normalizeSessionView(sessionState || getSessionState())
    try {
      console.info(`[session-ui] home status=${sessionView.code} text=${sessionView.text}`)
    } catch (error) {}
    this.setData({ sessionView })
  },

  onAiInputChange(e) {
    this.setData({ aiInput: toText(e.detail.value) })
  },

  onAiInputFocus() {
    this.setData({ aiInputFocused: true })
  },

  onAiInputBlur() {
    this.setData({ aiInputFocused: false })
  },

  openAiChat(prompt) {
    const source = typeof prompt === 'string' ? prompt : this.data.aiInput
    const next = encodeURIComponent(toText(source).trim())
    if (!next) {
      wx.showToast({ title: TEXT.noPrompt, icon: 'none' })
      return
    }
    wx.navigateTo({ url: `/pages/aiFeatures/aiFeatures?prompt=${next}` })
  },

  useAiPrompt(e) {
    this.openAiChat(e.currentTarget.dataset.prompt || '')
  },

  openAnalytics() {
    wx.navigateTo({ url: '/pages/analytics/analytics' })
  },

  openStarredContacts() {
    wx.setStorageSync('contacts_initial_filter', 'starred')
    wx.switchTab({ url: '/pages/contacts/contacts' })
  },

  openContactDetail(e) {
    const id = e.currentTarget.dataset.id || ''
    const cardId = e.currentTarget.dataset.cardId || ''
    if (cardId) {
      wx.navigateTo({ url: `/pages/cardDetail/cardDetail?id=${cardId}&visitor=1` })
      return
    }
    if (!id) return
    wx.navigateTo({ url: `/pages/contactdetail/contactdetail?id=${id}` })
  },

  cycleAiTone() {
    const current = this.data.settingsSummary.aiTone
    const index = Math.max(0, AI_TONES.indexOf(current))
    const next = normalizeSettings(updateSettings({ aiTone: AI_TONES[(index + 1) % AI_TONES.length] }))
    this.setData({ settingsSummary: next })
  },

  togglePublicDynamics() {
    const next = normalizeSettings(updateSettings({ publicDynamics: !this.data.settingsSummary.publicDynamics }))
    this.setData({ settingsSummary: next })
  },

  openBlacklist() {
    wx.navigateTo({ url: '/pages/blacklist/blacklist' })
  },

  openMember() {
    wx.navigateTo({ url: '/pages/member/member' })
  },

  openSuggestionForm() {
    this.setData({ showSuggestionForm: true })
  },

  closeSuggestionForm() {
    this.setData({ showSuggestionForm: false, suggestionContent: '', suggestionContact: '' })
  },

  onSuggestionContentInput(e) {
    this.setData({ suggestionContent: toText(e.detail.value) })
  },

  onSuggestionContactInput(e) {
    this.setData({ suggestionContact: toText(e.detail.value) })
  },

  submitSuggestion() {
    const content = toText(this.data.suggestionContent).trim()
    if (!content) {
      wx.showToast({ title: TEXT.noPrompt, icon: 'none' })
      return
    }
    try {
      addSuggestion({ content, contact: this.data.suggestionContact })
      wx.showToast({ title: TEXT.saved, icon: 'success' })
      this.closeSuggestionForm()
    } catch (error) {
      console.error('submit suggestion failed:', error)
      wx.showToast({ title: TEXT.saveFailed, icon: 'none' })
    }
  }
})
