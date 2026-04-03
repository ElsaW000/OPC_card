const app = getApp()
const { bootstrapSessionAsync, getCurrentUser, hasAuthenticatedRemoteSession, clearRemoteSession } = require('../../services/userService')
const { getCards } = require('../../services/cardService')
const { getApiBaseUrl, setApiBaseUrl, isRemoteApiEnabled, setRemoteApiEnabled } = require('../../services/apiConfig')
const { request } = require('../../services/httpClient')
const { readSettings, updateSettings } = require('../../services/settingsService')

const SETTINGS_KEY = 'eseat_local_settings'

const DEFAULT_SETTINGS = {
  privacy_mode: '\u4ea4\u6362\u540e\u53ef\u89c1',
  public_dynamics: true,
  ai_tone: '\u4e13\u4e1a\u53cb\u597d',
}

function maskPhone(phone) {
  const s = String(phone || '')
  if (s.length < 7) return s || '---'
  return s.slice(0, 3) + '****' + s.slice(-4)
}

function maskOpenId(openid) {
  const s = String(openid || '')
  if (!s) return '---'
  if (s.length <= 10) return s
  return `${s.slice(0, 4)}...${s.slice(-4)}`
}

function loadLocalSettings() {
  const sharedSettings = readSettings()
  try {
    return {
      ...DEFAULT_SETTINGS,
      ...(wx.getStorageSync(SETTINGS_KEY) || {}),
      allowAiContactsContext: !!(sharedSettings && sharedSettings.allowAiContactsContext),
    }
  } catch (e) {
    return {
      ...DEFAULT_SETTINGS,
      allowAiContactsContext: !!(sharedSettings && sharedSettings.allowAiContactsContext),
    }
  }
}

function saveLocalSettings(settings) {
  try {
    wx.setStorageSync(SETTINGS_KEY, settings)
  } catch (e) {}
}

function readAllowAiContactsContext(settings) {
  if (!settings || typeof settings !== 'object') return false
  if (settings.allow_ai_contacts_context != null) return !!settings.allow_ai_contacts_context
  if (settings.allowAiContactsContext != null) return !!settings.allowAiContactsContext
  return false
}

Page({
  data: {
    profile: {
      name: '',
      avatarUrl: '',
      phone: '',
      wechat: '',
    },
    basicInfo: [
      { label: '昵称', value: '---' },
      { label: '绑定手机号', value: '---' },
      { label: '微信号', value: '---' },
    ],
    accountInfo: [
      { label: '用户 ID', value: '---' },
      { label: 'OpenID', value: '---' },
      { label: 'AppID', value: '---' },
    ],
    showAccountInfo: false,
    settings: { ...DEFAULT_SETTINGS },
    apiUrl: '',
    useRemoteApi: false,
    apiEditing: false,
    apiUrlInput: '',
    privacyOptions: ['\u4ea4\u6362\u540e\u53ef\u89c1', '\u5168\u516c\u5f00', '\u4ec5\u81ea\u5df1\u53ef\u89c1'],
    privacyIndex: 0,
    aiContactsContextEnabled: false,
    isDev: false,
  },

  tapVersion() {
    if (!this._devTapCount) this._devTapCount = 0
    this._devTapCount++
    if (this._devTapCount >= 5) {
      this._devTapCount = 0
      this.setData({ isDev: true, showAccountInfo: true })
      wx.showToast({ title: '开发者模式已开启', icon: 'none' })
    }
  },

  async onLoad() {
    const apiUrl = getApiBaseUrl()
    const useRemoteApi = isRemoteApiEnabled()
    const settings = readSettings()
    await bootstrapSessionAsync()
    this.setData({
      apiUrl,
      useRemoteApi,
      apiUrlInput: apiUrl,
      aiContactsContextEnabled: !!settings.allowAiContactsContext,
    })
    this.loadProfile()
    await this.loadSettings()
  },

  loadProfile() {
    const session = getCurrentUser() || {}
    let card = app.globalData && app.globalData.cardData
    if (!card) {
      try {
        const result = getCards()
        card = (result && result.defaultCard) || null
      } catch (e) {}
    }
    if (card) {
      this.setData({
        profile: {
          name: card.name || card.nickname || '\u6211\u7684\u540d\u7247',
          avatarUrl: card.avatarUrl || '',
          phone: maskPhone(card.phone),
          wechat: card.wechat || '',
        },
        basicInfo: [
          { label: '昵称', value: card.name || card.nickname || '我的名片' },
          { label: '绑定手机号', value: maskPhone(card.phone) },
          { label: '微信号', value: card.wechat || '---' },
        ],
        accountInfo: [
          { label: '用户 ID', value: session.userId || '---' },
          { label: 'OpenID', value: maskOpenId(session.openid) },
          { label: 'AppID', value: session.appid || '---' },
        ],
      })
      return
    }

    this.setData({
      basicInfo: [
        { label: '昵称', value: '我的名片' },
        { label: '绑定手机号', value: '---' },
        { label: '微信号', value: '---' },
      ],
      accountInfo: [
        { label: '用户 ID', value: session.userId || '---' },
        { label: 'OpenID', value: maskOpenId(session.openid) },
        { label: 'AppID', value: session.appid || '---' },
      ],
    })
  },

  async loadSettings() {
    const local = loadLocalSettings()
    this.applySettings(local)

    if (!isRemoteApiEnabled() || !hasAuthenticatedRemoteSession()) {
      try {
        console.info('[session] skip protected request /auth/me: authenticated-remote-session-required')
      } catch (error) {}
      return
    }
    try {
      const session = getCurrentUser()
      if (!session || !session.userId) return
      const result = await request({
        url: '/auth/me',
        method: 'GET',
        userId: session.userId,
      })
      if (result && result.success) {
        if (result.user) {
          const u = result.user
            const session = getCurrentUser() || {}
          this.setData({
            'profile.name': u.nickname || this.data.profile.name,
            'profile.avatarUrl': u.avatar_url || this.data.profile.avatarUrl,
            'profile.phone': maskPhone(u.phone) || this.data.profile.phone,
              basicInfo: [
                { label: '昵称', value: u.nickname || this.data.profile.name || '我的名片' },
                { label: '绑定手机号', value: maskPhone(u.phone) || this.data.profile.phone || '---' },
                { label: '微信号', value: this.data.profile.wechat || '---' },
              ],
              accountInfo: [
                { label: '用户 ID', value: session.userId || u.id || '---' },
                { label: 'OpenID', value: maskOpenId(session.openid) },
                { label: 'AppID', value: session.appid || '---' },
              ],
          })
        }
        if (result.settings) {
          this.applySettings(result.settings)
        }
      }
    } catch (error) {
      console.error('load settings failed:', error)
    }
  },

  applySettings(s) {
    const options = this.data.privacyOptions
    const privacyIndex = Math.max(0, options.indexOf(s.privacy_mode))
    const allowAiContactsContext = readAllowAiContactsContext(s)
    updateSettings({ allowAiContactsContext })
    this.setData({
      settings: {
        privacy_mode: s.privacy_mode || DEFAULT_SETTINGS.privacy_mode,
        public_dynamics: s.public_dynamics !== false,
        ai_tone: s.ai_tone || DEFAULT_SETTINGS.ai_tone,
      },
      privacyIndex,
      aiContactsContextEnabled: allowAiContactsContext,
    })
  },

  onPublicDynamicsChange(e) {
    const val = e.detail.value
    const settings = { ...this.data.settings, public_dynamics: val }
    this.setData({ settings })
    this.persistSettings(settings)
  },

  onAiContactsContextChange(e) {
    const enabled = !!(e && e.detail && e.detail.value)
    this.setData({ aiContactsContextEnabled: enabled })
    updateSettings({ allowAiContactsContext: enabled })
    if (isRemoteApiEnabled() && hasAuthenticatedRemoteSession()) {
      const session = getCurrentUser()
      if (session && session.userId) {
        request({
          url: '/auth/settings',
          method: 'PATCH',
          data: { allow_ai_contacts_context: enabled },
          userId: session.userId,
        }).catch((err) => console.error('save ai contacts context failed:', err))
      }
    }
    wx.showToast({
      title: enabled ? 'AI 联系人推荐已开启' : 'AI 联系人推荐已关闭',
      icon: 'none'
    })
  },

  onPrivacyChange(e) {
    const index = Number(e.detail.value)
    const privacy_mode = this.data.privacyOptions[index]
    const settings = { ...this.data.settings, privacy_mode }
    this.setData({ settings, privacyIndex: index })
    this.persistSettings(settings)
  },

  persistSettings(settings) {
    saveLocalSettings(settings)
    if (!isRemoteApiEnabled() || !hasAuthenticatedRemoteSession()) return
    const session = getCurrentUser()
    if (!session || !session.userId) return
    request({
      url: '/auth/settings',
      method: 'PATCH',
      data: settings,
      userId: session.userId,
    }).catch((err) => console.error('save settings failed:', err))
  },

  // API settings
  toggleApiEditing() {
    this.setData({ apiEditing: !this.data.apiEditing })
  },

  onApiUrlInput(e) {
    this.setData({ apiUrlInput: e.detail.value })
  },

  saveApiUrl() {
    const url = (this.data.apiUrlInput || '').trim()
    if (url) {
      setApiBaseUrl(url)
      this.setData({ apiUrl: url, apiEditing: false })
      wx.showToast({ title: '\u5df2\u4fdd\u5b58', icon: 'success' })
    }
  },

  onRemoteApiChange(e) {
    const enabled = e.detail.value
    setRemoteApiEnabled(enabled)
    this.setData({ useRemoteApi: enabled })
    wx.showToast({ title: enabled ? '\u5df2\u5f00\u542f\u8fdc\u7a0b\u6a21\u5f0f' : '\u5df2\u5207\u6362\u672c\u5730\u6a21\u5f0f', icon: 'none' })
  },

  // Navigation
  goToQRCode() {
    wx.navigateTo({ url: '/pages/qrcode/qrcode' })
  },

  goToMember() {
    wx.navigateTo({ url: '/pages/member/member' })
  },

  // Logout
  logout() {
    wx.showModal({
      title: '\u786e\u8ba4\u9000\u51fa',
      content: '\u9000\u51fa\u767b\u5f55\u540e\u9700\u91cd\u65b0\u6388\u6743',
      success: (res) => {
        if (!res.confirm) return
        clearRemoteSession()
        setRemoteApiEnabled(false)
        if (app.globalData) {
          app.globalData.cardData = null
          app.globalData.sessionReady = false
        }
        wx.reLaunch({ url: '/pages/home/home' })
      }
    })
  }
})
