const KEY = 'opc_api_base_url'
const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8004/api/v1'

function getApiBaseUrl() {
  const saved = wx.getStorageSync(KEY)
  if (!saved) return DEFAULT_API_BASE_URL
  if (saved === 'http://127.0.0.1:8001/api/v1') {
    wx.setStorageSync(KEY, DEFAULT_API_BASE_URL)
    return DEFAULT_API_BASE_URL
  }
  return saved
}

function setApiBaseUrl(url) {
  wx.setStorageSync(KEY, url)
}

function isRemoteApiEnabled() {
  return !!wx.getStorageSync('opc_use_remote_api')
}

function setRemoteApiEnabled(enabled) {
  wx.setStorageSync('opc_use_remote_api', !!enabled)
}

module.exports = {
  getApiBaseUrl,
  setApiBaseUrl,
  isRemoteApiEnabled,
  setRemoteApiEnabled,
}