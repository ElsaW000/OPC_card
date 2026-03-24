// index.js - 按照 Figma 设计重构

const app = getApp()

Page({
  data: {
    // 模板
    currentTemplate: 'universal',
    templateName: '通用',
    
    // 自定义卡片
    customCards: [],
    
    // Banner
    bannerUrl: 'https://images.unsplash.com/photo-1647247743538-0137d6a8a268?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    
    // 头像
    avatarUrl: 'https://images.unsplash.com/photo-1701463387028-3947648f1337?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
    
    // 个人信息
    name: '陈小独立 (Independent Chen)',
    role: 'OPC 创始人 / 全栈工程师',
    location: '中国，深圳',
    bio: '一名专注于构建 AI 工具与效率应用的独立开发者。我喜欢探索极致的产品体验，并将复杂的逻辑简化为直观的 UI。目前致力于 OPC (一人公司) 的规模化与自动化。',
    
    // 程序员字段
    years: '8+',
    techStack: '',
    
    // 设计师字段
    portfolio: '',
    styles: '',
    experience: '',
    
    // 老板字段
    company: '',
    business: '',
    cooperation: '',
    wechat: '',
    
    // 社交链接
    githubUrl: 'https://github.com/example',
    twitterUrl: 'https://twitter.com/example',
    
    // 数据统计
    products: '12',
    users: '25k',
    
    // 联系方式
    phone: '13800138000',
    email: 'hello@example.com',
    
    // 产品项目
    projects: [
      {
        id: '1',
        title: 'CodeFlow AI',
        description: '一个帮助独立开发者通过自然语言直接生成 React 组件的 AI 工作流。',
        thumbnail: 'https://images.unsplash.com/photo-1575388902449-6bca946ad549?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600',
        link: 'https://codeflow.example.com',
        github: 'https://github.com/example/codeflow',
        tags: ['AI', 'React', 'SaaS']
      },
      {
        id: '2',
        title: 'ZenTask Mobile',
        description: '极简主义的个人效率工具，支持跨端同步与离线工作。',
        thumbnail: 'https://images.unsplash.com/photo-1758598303946-385680e4eabd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600',
        link: 'https://zentask.example.com',
        tags: ['Mobile', 'Flutter', 'Efficiency']
      },
      {
        id: '3',
        title: 'Minimalist Blog Engine',
        description: '为独立创造者打造的极致轻量级博客平台，SEO 优化友好。',
        thumbnail: 'https://images.unsplash.com/photo-1768406389205-3929ab8661e9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600',
        link: 'https://blog.example.com',
        github: 'https://github.com/example/blog',
        tags: ['Blog', 'Next.js', 'SEO']
      }
    ]
  },

  onLoad() {
    // 从云端加载名片数据
    this.loadCardData();
  },

  onShow() {
    // 页面显示时，刷新数据
    this.loadCardData();
  },

  loadCardData() {
    wx.showLoading({ title: '加载中...' });
    
    wx.cloud.callFunction({
      name: 'getCard',
      success: (res) => {
        wx.hideLoading();
        if (res.result && res.result.success) {
          const cardData = res.result.data;
          
          // 模板名称映射
          const templateNames = {
            universal: '通用',
            developer: '程序员',
            designer: '设计师',
            boss: '老板'
          };
          
          // 设置模板名称
          cardData.templateName = templateNames[cardData.template] || '通用';
          
          // 存储到全局
          app.globalData.cardData = cardData;
          this.setData(cardData);
        } else {
          wx.showToast({
            title: '加载失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('加载名片失败', err);
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      }
    });
  },

  // 拨打电话
  callPhone() {
    wx.makePhoneCall({
      phoneNumber: this.data.phone
    })
  },

  // 复制邮箱
  copyEmail(e) {
    const email = e.currentTarget.dataset.text || this.data.email;
    wx.setClipboardData({
      data: email,
      success: () => {
        wx.showToast({
          title: '邮箱已复制',
          icon: 'success'
        })
      }
    })
  },

  // 保存联系人
  saveContact() {
    wx.addPhoneContact({
      firstName: this.data.name.split(' ')[0],
      title: this.data.role,
      organization: 'OPC',
      mobilePhoneNumber: this.data.phone,
      email: this.data.email,
      success: () => {
        wx.showToast({
          title: '联系人已保存',
          icon: 'success'
        })
      }
    })
  },

  // 分享名片 - 触发分享
  shareCard() {
    // 小程序分享需要通过 onShareAppMessage 实现
    // 这里可以提示用户点击右上角分享
    wx.showModal({
      title: '分享名片',
      content: '请点击右上角「...」按钮进行分享',
      showCancel: false
    })
  },

  // 打开外部链接
  openLink(e) {
    const link = e.currentTarget.dataset.link;
    if (link) {
      wx.navigateTo({
        url: `/pages/webview/webview?url=${encodeURIComponent(link)}`
      })
    } else {
      wx.showToast({
        title: '链接无效',
        icon: 'none'
      })
    }
  },

  // 编辑名片
  editCard() {
    wx.navigateTo({
      url: '/pages/edit/edit'
    })
  },

  // 分享配置
  onShareAppMessage() {
    return {
      title: `${this.data.name} 的名片`,
      path: '/pages/index/index',
      imageUrl: this.data.avatarUrl
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: `${this.data.name} 的名片`,
      query: '',
      imageUrl: this.data.avatarUrl
    }
  }
})
