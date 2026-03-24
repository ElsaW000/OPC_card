// edit.js - 按照 Figma 设计重构

const app = getApp()

Page({
  data: {
    // Banner & 头像
    bannerUrl: 'https://images.unsplash.com/photo-1647247743538-0137d6a8a268?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    avatarUrl: 'https://images.unsplash.com/photo-1701463387028-3947648f1337?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
    
    // 基本信息
    name: '',
    role: '',
    location: '',
    bio: '',
    
    // 社交链接
    githubUrl: '',
    twitterUrl: '',
    
    // 数据统计
    years: '',
    products: '',
    users: '',
    
    // 联系方式
    phone: '',
    email: '',
    
    // 产品/项目
    projects: []
  },

  onLoad() {
    // 从全局数据或存储中加载当前数据
    const globalData = app.globalData.cardData || this.getDefaultData();
    this.setData(globalData);
  },

  getDefaultData() {
    return {
      bannerUrl: 'https://images.unsplash.com/photo-1647247743538-0137d6a8a268?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
      avatarUrl: 'https://images.unsplash.com/photo-1701463387028-3947648f1337?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
      name: '陈小独立',
      role: 'OPC 创始人 / 全栈工程师',
      location: '中国，深圳',
      bio: '一名专注于构建 AI 工具与效率应用的独立开发者...',
      githubUrl: 'https://github.com/example',
      twitterUrl: 'https://twitter.com/example',
      years: '8+',
      products: '12',
      users: '25k',
      phone: '13800138000',
      email: 'hello@example.com',
      projects: [
        {
          id: '1',
          title: 'CodeFlow AI',
          description: '一个帮助独立开发者通过自然语言直接生成 React 组件的 AI 工作流。',
          thumbnail: '',
          link: 'https://codeflow.example.com',
          github: 'https://github.com/example/codeflow',
          tags: 'AI, React, SaaS'
        }
      ]
    };
  },

  // 输入框变化
  onInputChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [field]: e.detail.value
    });
  },

  // 选择图片
  chooseBanner() {
    wx.chooseImage({
      count: 1,
      success: (res) => {
        this.setData({
          bannerUrl: res.tempFilePaths[0]
        });
      }
    });
  },

  chooseAvatar() {
    wx.chooseImage({
      count: 1,
      success: (res) => {
        this.setData({
          avatarUrl: res.tempFilePaths[0]
        });
      }
    });
  },

  // 添加产品
  addProject() {
    const projects = this.data.projects;
    const newId = Date.now().toString();
    projects.push({
      id: newId,
      title: '',
      description: '',
      thumbnail: '',
      link: '',
      github: '',
      tags: ''
    });
    this.setData({ projects });
  },

  // 删除产品
  removeProject(e) {
    const index = e.currentTarget.dataset.index;
    const projects = this.data.projects;
    projects.splice(index, 1);
    this.setData({ projects });
  },

  // 产品输入变化
  onProjectChange(e) {
    const index = e.currentTarget.dataset.index;
    const field = e.currentTarget.dataset.field;
    const projects = this.data.projects;
    projects[index][field] = e.detail.value;
    this.setData({ projects });
  },

  // 保存到云端
  saveCard() {
    wx.showLoading({ title: '保存中...' });
    
    // 处理 tags 字符串转数组
    const projects = this.data.projects.map(p => ({
      ...p,
      tags: p.tags ? p.tags.split(',').map(t => t.trim()) : []
    }));

    const cardData = {
      bannerUrl: this.data.bannerUrl,
      avatarUrl: this.data.avatarUrl,
      name: this.data.name,
      role: this.data.role,
      location: this.data.location,
      bio: this.data.bio,
      githubUrl: this.data.githubUrl,
      twitterUrl: this.data.twitterUrl,
      years: this.data.years,
      products: this.data.products,
      users: this.data.users,
      phone: this.data.phone,
      email: this.data.email,
      projects: projects
    };
    
    wx.cloud.callFunction({
      name: 'saveCard',
      data: { cardData: cardData },
      success: (res) => {
        wx.hideLoading();
        if (res.result && res.result.success) {
          // 保存到全局
          app.globalData.cardData = cardData;
          
          wx.showToast({
            title: '保存成功',
            icon: 'success'
          });
          
          // 返回上一页
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({
            title: '保存失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('保存失败', err);
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        });
      }
    });
  }
})
