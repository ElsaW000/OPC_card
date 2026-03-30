const KEY = 'opc_api_base_url'

function getApiBaseUrl() {
  return wx.getStorageSync(KEY) || 'http://127.0.0.1:8001/api/v1'
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