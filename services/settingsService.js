const SETTINGS_KEY = 'opc_settings_v1'

function getDefaultSettings() {
  return {
    aiTone: '专业且友好',
    publicDynamics: true,
    privacyMode: '交换后可见',
    blacklist: [
      { id: 'blk_1', name: '营销测试用户' }
    ],
    suggestions: [],
    allowAiContactsContext: false
  }
}

function readSettings() {
  const saved = wx.getStorageSync(SETTINGS_KEY)
  if (saved && typeof saved === 'object') {
    return {
      ...getDefaultSettings(),
      ...saved,
      blacklist: Array.isArray(saved.blacklist) ? saved.blacklist : getDefaultSettings().blacklist,
      suggestions: Array.isArray(saved.suggestions) ? saved.suggestions : []
    }
  }
  const next = getDefaultSettings()
  wx.setStorageSync(SETTINGS_KEY, next)
  return next
}

function writeSettings(next) {
  wx.setStorageSync(SETTINGS_KEY, next)
  return next
}

function updateSettings(patch) {
  const current = readSettings()
  const next = {
    ...current,
    ...patch
  }
  writeSettings(next)
  return next
}

function addSuggestion(payload = {}) {
  const current = readSettings()
  const next = {
    ...current,
    suggestions: [{
      id: `sug_${Date.now()}`,
      content: payload.content || '',
      contact: payload.contact || '',
      createdAt: new Date().toISOString()
    }].concat(current.suggestions || [])
  }
  writeSettings(next)
  return { success: true, data: next }
}

module.exports = {
  readSettings,
  updateSettings,
  addSuggestion
}
