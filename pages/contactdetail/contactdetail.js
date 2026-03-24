// contactdetail.js

Page({
  data: {
    contact: {
      name: 'Sarah Zhang',
      role: '产品经理 @ ByteDance',
      locationCountry: '中国',
      locationCity: '北京',
      avatarUrl: 'https://images.unsplash.com/photo-1573164713791-0dfcd2a183a7?w=400',
      bannerUrl: 'https://images.unsplash.com/photo-1647247743538-0137d6a8a268?w=800',
      bio: '专注 AI 产品设计与用户增长，8 年经验',
      phone: '13800138000',
      email: 'sarah@example.com',
      wechat: 'sarah-zhang'
    }
  },

  onLoad(options) {
    if (options.id) {
      this.loadContact(options.id)
    }
  },

  loadContact(id) {
    wx.cloud.callFunction({
      name: 'getContactDetail',
      data: { contactId: id },
      success: (res) => {
        if (res.result && res.result.success) {
          this.setData({ contact: res.result.data })
        }
      }
    })
  },

  callPhone() {
    wx.makePhoneCall({ phoneNumber: this.data.contact.phone })
  },

  copyEmail() {
    wx.setClipboardData({ data: this.data.contact.email })
  },

  copyWechat() {
    wx.setClipboardData({ data: this.data.contact.wechat })
  },

  sendMessage() {
    wx.showToast({ title: '跳转聊天', icon: 'none' })
  },

  addToContact() {
    wx.addPhoneContact({
      firstName: this.data.contact.name,
      mobilePhoneNumber: this.data.contact.phone,
      email: this.data.contact.email
    })
  }
})
