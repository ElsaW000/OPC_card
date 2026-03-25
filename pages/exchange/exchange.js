// exchange.js - 交换名片

Page({
  data: {
    currentTab: 0,
    currentCard: {
      name: '陈独立',
      role: 'Full-stack Developer',
      company: 'CodeFlow AI Studio'
    }
  },

  onLoad() {
    this.loadCurrentCard();
  },

  loadCurrentCard() {
    // 加载当前默认名片
    wx.cloud.callFunction({
      name: 'getCards',
      success: (res) => {
        if (res.result && res.result.success && res.result.defaultCard) {
          this.setData({
            currentCard: {
              name: res.result.defaultCard.name,
              role: res.result.defaultCard.role,
              company: res.result.defaultCard.company
            }
          });
        }
      }
    });
  },

  switchTab(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ currentTab: index });
  },

  changeCard() {
    // 切换到其他名片
    wx.navigateTo({
      url: '/pages/mycards/mycards'
    });
  },

  searchManual() {
    // 手动搜索交换
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  startScan() {
    // 开始扫描
    wx.scanCode({
      success: (res) => {
        console.log('扫描结果:', res.result);
        wx.showToast({
          title: '扫描成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        console.error('扫描失败:', err);
      }
    });
  }
});