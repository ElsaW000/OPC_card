const BLACKLIST_KEY = 'eseat_blacklist'

function loadBlacklist() {
  try {
    return wx.getStorageSync(BLACKLIST_KEY) || []
  } catch (e) {
    return []
  }
}

function saveBlacklist(list) {
  try {
    wx.setStorageSync(BLACKLIST_KEY, list)
  } catch (e) {}
}

Page({
  data: {
    list: []
  },

  onLoad() {
    this.refreshList()
  },

  onShow() {
    this.refreshList()
  },

  refreshList() {
    const raw = loadBlacklist()
    const list = Array.isArray(raw) ? raw : []
    this.setData({ list })
  },

  removeFromBlacklist(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '移除黑名单',
      content: '确定将此用户从黑名单移除吗？',
      success: (res) => {
        if (res.confirm) {
          const raw = loadBlacklist()
          const updated = Array.isArray(raw) ? raw.filter(item => item.id !== id) : []
          saveBlacklist(updated)
          this.refreshList()
          wx.showToast({ title: '已移除', icon: 'success' })
        }
      }
    })
  }
})
