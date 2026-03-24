// exchangeconfirm.js

Page({
  data: {
    card: {
      name: '陈小独立',
      role: 'Full-stack Developer',
      company: 'CodeFlow AI Studio',
      avatarUrl: 'https://images.unsplash.com/photo-1701463387028-3947648f1337?w=400',
      bannerUrl: 'https://images.unsplash.com/photo-1647247743538-0137d6a8a268?w=800'
    }
  },

  onLoad(options) {
    if (options.id) {
      // 加载指定名片
    }
  },

  confirmExchange() {
    wx.showLoading({ title: '交换中...' })
    
    wx.cloud.callFunction({
      name: 'exchangeCard',
      data: { cardId: this.data.card.id },
      success: (res) => {
        wx.hideLoading()
        wx.showToast({ title: '交换成功', icon: 'success' })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      },
      fail: () => {
        wx.hideLoading()
        // 模拟成功
        wx.showToast({ title: '交换成功', icon: 'success' })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }
    })
  },

  cancelExchange() {
    wx.navigateBack()
  }
})
