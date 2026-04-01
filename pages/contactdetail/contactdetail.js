const { getContactDetailAsync } = require('../../services/contactService')
const { bootstrapSessionAsync } = require('../../services/userService')
const { getErrorMessage } = require('../../services/errorUtils')

function normalizeText(value, fallback = '') {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

function buildSafeContactData(contact = {}) {
  return {
    name: normalizeText(contact.name, 'Sarah Zhang'),
    role: normalizeText(contact.role, '\u4ea7\u54c1\u7ecf\u7406 @ ByteDance'),
    locationCountry: normalizeText(contact.locationCountry, '\u4e2d\u56fd'),
    locationCity: normalizeText(contact.locationCity, '\u5317\u4eac'),
    avatarUrl: normalizeText(contact.avatarUrl, 'https://images.unsplash.com/photo-1573164713791-0dfcd2a183a7?w=400'),
    bannerUrl: normalizeText(contact.bannerUrl, 'https://images.unsplash.com/photo-1647247743538-0137d6a8a268?w=800'),
    bio: normalizeText(contact.bio),
    phone: normalizeText(contact.phone),
    email: normalizeText(contact.email),
    wechat: normalizeText(contact.wechat)
  }
}

Page({
  data: {
    contact: buildSafeContactData()
  },

  async onLoad(options) {
    if (options.id) {
      await this.loadContact(options.id)
    }
  },

  async loadContact(id) {
    try {
      await bootstrapSessionAsync()
    } catch (error) {
      wx.showToast({ title: getErrorMessage(error, '\u52a0\u8f7d\u5931\u8d25').slice(0, 20), icon: 'none' })
      return
    }

    const result = await getContactDetailAsync(id)
    if (result.success) {
      this.setData({ contact: buildSafeContactData(result.data) })
      return
    }
    wx.showToast({ title: getErrorMessage(result.error, '\u52a0\u8f7d\u5931\u8d25').slice(0, 20), icon: 'none' })
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
    wx.showToast({ title: '\u804a\u5929\u529f\u80fd\u540e\u7eed\u63a5 App', icon: 'none' })
  },

  addToContact() {
    wx.addPhoneContact({
      firstName: this.data.contact.name,
      mobilePhoneNumber: this.data.contact.phone,
      email: this.data.contact.email
    })
  }
})