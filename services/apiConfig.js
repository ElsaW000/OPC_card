const KEY = 'opc_api_base_url'
const REMOTE_KEY = 'opc_use_remote_api'
const RUNTIME_ENV_KEY = 'opc_runtime_env'
const DEFAULT_API_BASE_URL = 'https://api.eseat.cn/api/v1'
const LEGACY_LOCAL_API_URLS = [
  'http://127.0.0.1:8001/api/v1',
  'http://127.0.0.1:8004/api/v1',
  'https://entity-interpreted-regular-notification.trycloudflare.com/api/v1',
  'https://writers-become-deserve-biological.trycloudflare.com/api/v1',
]

function getApiBaseUrl() {
  const saved = wx.getStorageSync(KEY)
  if (!saved) return DEFAULT_API_BASE_URL
  if (LEGACY_LOCAL_API_URLS.includes(saved)) {
    wx.setStorageSync(KEY, DEFAULT_API_BASE_URL)
    return DEFAULT_API_BASE_URL
  }
  return saved
}

function setApiBaseUrl(url) {
  wx.setStorageSync(KEY, url)
}

function hasExplicitRemoteApiPreference() {
  return wx.getStorageSync(REMOTE_KEY) !== ''
    && wx.getStorageSync(REMOTE_KEY) !== undefined
    && wx.getStorageSync(REMOTE_KEY) !== null
}

function isRemoteApiEnabled() {
  if (hasExplicitRemoteApiPreference()) {
    return !!wx.getStorageSync(REMOTE_KEY)
  }
  return true
}

function setRemoteApiEnabled(enabled) {
  wx.setStorageSync(REMOTE_KEY, !!enabled)
}

function getRuntimeEnv() {
  const saved = wx.getStorageSync(RUNTIME_ENV_KEY)
  if (saved === 'development' || saved === 'staging' || saved === 'production') {
    return saved
  }
  return 'staging'
}

function setRuntimeEnv(env) {
  const normalized = env === 'development' || env === 'production' ? env : 'staging'
  wx.setStorageSync(RUNTIME_ENV_KEY, normalized)
}

function allowsLocalMockFallback() {
  return getRuntimeEnv() === 'development'
}

module.exports = {
  getApiBaseUrl,
  setApiBaseUrl,
  hasExplicitRemoteApiPreference,
  isRemoteApiEnabled,
  setRemoteApiEnabled,
  getRuntimeEnv,
  setRuntimeEnv,
  allowsLocalMockFallback,
}
