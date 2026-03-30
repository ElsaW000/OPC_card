// edit.js - 按照 Figma 设计重构

const app = getApp()
const { saveCardAsync } = require('../../services/cardService')
const { bootstrapSessionAsync } = require('../../services/userService')
const { generateAI } = require('../../services/aiService')


// 模板配置
const TEMPLATES = {
  universal: {
    id: 'universal',
    name: '通用',
    fields: ['name', 'role', 'location', 'bio', 'phone', 'email', 'githubUrl', 'twitterUrl']
  },
  developer: {
    id: 'developer',
    name: '程序员',
    fields: ['name', 'role', 'location', 'bio', 'years', 'techStack', 'projects', 'githubUrl', 'phone', 'email']
  },
  designer: {
    id: 'designer',
    name: '设计师',
    fields: ['name', 'role', 'location', 'bio', 'portfolio', 'styles', 'experience', 'phone', 'email', 'twitterUrl']
  },
  boss: {
    id: 'boss',
    name: '老板',
    fields: ['name', 'role', 'company', 'business', 'cooperation', 'bio', 'phone', 'email', 'wechat']
  }
}

Page({
  data: {
    // 模板选择
    currentTemplate: 'universal',
    templates: TEMPLATES,
    
    // AI 输入
    aiInput: '',
    
    // 自定义卡片
    customCards: [],
    
    // Banner & 头像
    bannerUrl: 'https://images.unsplash.com/photo-1647247743538-0137d6a8a268?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    avatarUrl: 'https://images.unsplash.com/photo-1701463387028-3947648f1337?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
    
    // 基本信息
    name: '',
    nameEn: '', // 英文名
    locationCountry: '', // 国家
    locationCity: '', // 省市
    bio: '',
    
    // 程序员字段
    years: '',
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
    githubUrl: '',
    twitterUrl: '',
    
    // 数据统计
    products: '',
    users: '',
    
    // 联系方式
    phone: '',
    email: '',
    
    // 产品/项目
    projects: [],
    
    // 视频/短视频
    videos: [],
    
    // 底部自定义联系模块
    footerTitle: '联系我',
    footerDesc: '如有合作意向，欢迎通过以下方式联系',
    
    // AI 推荐标签
    suggestedTags: []
  },

  onLoad(options) {
    // ???????????????
    const globalData = app.globalData.cardData || this.getDefaultData();
    this.editingCardId = (options && options.id) || globalData._id || globalData.id || '';
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

  buildCardPayload() {
    const projects = this.data.projects.map(p => ({
      ...p,
      tags: Array.isArray(p.tags)
        ? p.tags
        : (p.tags ? String(p.tags).split(',').map(t => t.trim()).filter(Boolean) : [])
    }));

    return {
      template: this.data.currentTemplate,
      customCards: Array.isArray(this.data.customCards) ? this.data.customCards : [],
      bannerUrl: this.data.bannerUrl,
      avatarUrl: this.data.avatarUrl,
      name: this.data.name,
      nameEn: this.data.nameEn,
      locationCountry: this.data.locationCountry,
      locationCity: this.data.locationCity,
      role: this.data.role,
      bio: this.data.bio,
      years: this.data.years,
      techStack: this.data.techStack,
      portfolio: this.data.portfolio,
      styles: this.data.styles,
      experience: this.data.experience,
      company: this.data.company,
      business: this.data.business,
      cooperation: this.data.cooperation,
      wechat: this.data.wechat,
      githubUrl: this.data.githubUrl,
      twitterUrl: this.data.twitterUrl,
      products: this.data.products,
      users: this.data.users,
      phone: this.data.phone,
      email: this.data.email,
      projects,
      videos: Array.isArray(this.data.videos) ? this.data.videos : [],
      footerTitle: this.data.footerTitle,
      footerDesc: this.data.footerDesc
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

  // 选择模板
  selectTemplate(e) {
    const templateId = e.currentTarget.dataset.id;
    this.setData({
      currentTemplate: templateId
    });
  },

  // 添加自定义卡片
  addCustomCard() {
    const customCards = this.data.customCards;
    customCards.push({
      id: Date.now().toString(),
      title: '',
      content: ''
    });
    this.setData({ customCards });
  },

  // 添加视频
  addVideo() {
    const videos = this.data.videos;
    videos.push({
      id: Date.now().toString(),
      title: '',
      thumbnail: '',
      link: '',
      views: '',
      duration: ''
    });
    this.setData({ videos });
  },

  // 删除视频
  removeVideo(e) {
    const index = e.currentTarget.dataset.index;
    const videos = this.data.videos;
    videos.splice(index, 1);
    this.setData({ videos });
  },

  // 视频输入变化
  onVideoChange(e) {
    const index = e.currentTarget.dataset.index;
    const field = e.currentTarget.dataset.field;
    const videos = this.data.videos;
    videos[index][field] = e.detail.value;
    this.setData({ videos });
  },

  // 删除自定义卡片
  removeCustomCard(e) {
    const index = e.currentTarget.dataset.index;
    const customCards = this.data.customCards;
    customCards.splice(index, 1);
    this.setData({ customCards });
  },

  // 自定义卡片输入变化
  onCustomCardChange(e) {
    const index = e.currentTarget.dataset.index;
    const field = e.currentTarget.dataset.field;
    const customCards = this.data.customCards;
    customCards[index][field] = e.detail.value;
    this.setData({ customCards });
  },

  // AI 一键生成（从文字提取字段）
  async generateFromAI() {
    if (!this.data.aiInput) {
      wx.showToast({ title: '请先输入一段关于你的介绍', icon: 'none' })
      return
    }

    wx.showLoading({ title: 'AI 识别中...' })

    try {
      const res = await generateAI('extract', { text: this.data.aiInput })
      wx.hideLoading()
      if (res && res.success) {
        const extracted = res.result || {}
        this.setData({
          name: extracted.name || this.data.name,
          role: extracted.role || this.data.role,
          locationCountry: extracted.locationCountry || this.data.locationCountry,
          locationCity: extracted.locationCity || this.data.locationCity,
          bio: extracted.bio || this.data.bio,
          years: extracted.years || this.data.years,
          techStack: extracted.techStack || this.data.techStack,
          projects: Array.isArray(extracted.projects) ? extracted.projects : this.data.projects,
          'customCards[0].title': extracted.tags ? '标签' : '',
          'customCards[0].content': extracted.tags ? extracted.tags.join(', ') : ''
        })
        wx.showToast({ title: 'AI 填充成功', icon: 'success' })
      } else {
        wx.showToast({ title: 'AI 识别失败', icon: 'none' })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('AI 识别失败', error)
      wx.showToast({ title: 'AI 识别失败', icon: 'none' })
    }
  },

  async generateIntro() {
    wx.showLoading({ title: 'AI 生成中...' })

    try {
      const res = await generateAI('generateIntro', {
        role: this.data.role,
        locationCity: this.data.locationCity,
        techStack: this.data.techStack
      })
      wx.hideLoading()
      if (res && res.success) {
        const intro = (res.result && res.result.intro) || ''
        this.setData({
          bio: intro || this.data.bio
        })
        wx.showToast({ title: '生成成功', icon: 'success' })
      } else {
        wx.showToast({ title: '生成失败', icon: 'none' })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('生成失败', error)
      wx.showToast({ title: '生成失败', icon: 'none' })
    }
  },

  async optimizeBio() {
    if (!this.data.bio) {
      wx.showToast({ title: '请先填写简介', icon: 'none' })
      return
    }

    wx.showLoading({ title: 'AI 优化中...' })

    try {
      const res = await generateAI('optimize', { bio: this.data.bio })
      wx.hideLoading()
      if (res && res.success) {
        const optimizedText = (res.result && res.result.optimizedText) || ''
        wx.showModal({
          title: 'AI 优化结果',
          content: optimizedText,
          showCancel: true,
          confirmText: '使用',
          success: (modalRes) => {
            if (modalRes.confirm) {
              this.setData({
                bio: optimizedText.replace('优化后的自我介绍：', '')
              })
            }
          }
        })
      } else {
        wx.showToast({ title: '优化失败', icon: 'none' })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('优化失败', error)
      wx.showToast({ title: '优化失败', icon: 'none' })
    }
  },

  async generateTags() {
    wx.showLoading({ title: 'AI 推荐中...' })

    try {
      const res = await generateAI('tags', { identity: this.data.role })
      wx.hideLoading()
      if (res && res.success) {
        this.setData({
          suggestedTags: Array.isArray(res.result) ? res.result : []
        })
        wx.showToast({ title: '推荐成功', icon: 'success' })
      } else {
        wx.showToast({ title: '推荐失败', icon: 'none' })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('推荐失败', error)
      wx.showToast({ title: '推荐失败', icon: 'none' })
    }
  },

  addTag(e) {
    const tag = e.currentTarget.dataset.tag
    // TODO: 将标签添加到对应字段
    wx.showToast({ title: '已添加: ' + tag, icon: 'none' })
  },

  // AI 读取 GitHub 项目
  async fetchGitHubProjects() {
    if (!this.data.githubUrl) {
      wx.showToast({ title: '请先填写 GitHub 地址', icon: 'none' })
      return
    }

    const match = this.data.githubUrl.match(/github\.com\/([^\/]+)/)
    if (!match) {
      wx.showToast({ title: 'GitHub 地址格式不对', icon: 'none' })
      return
    }

    const username = match[1]
    wx.showLoading({ title: 'AI 读取中...' })

    try {
      const res = await generateAI('fetchGitHub', { username })
      wx.hideLoading()
      if (res && res.success && res.result && Array.isArray(res.result.projects)) {
        const projects = res.result.projects
        const newProjects = projects.map((p, index) => ({
          id: Date.now().toString() + index,
          title: p.name,
          description: p.description || '',
          thumbnail: '',
          link: p.url,
          github: p.url,
          tags: p.topics || []
        }))
        this.setData({
          projects: [...this.data.projects, ...newProjects]
        })
        wx.showToast({ title: `已添加 ${projects.length} 个项目`, icon: 'success' })
      } else {
        wx.showToast({ title: '读取失败', icon: 'none' })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('读取失败', error)
      wx.showToast({ title: '读取失败', icon: 'none' })
    }
  },

  async fetchProjectReadme(e) {
    const index = e.currentTarget.dataset.index
    const project = this.data.projects[index]

    if (!project.github) {
      wx.showToast({ title: '请先填写 GitHub 链接', icon: 'none' })
      return
    }

    const match = project.github.match(/github\.com\/([^\/]+)\/([^\/]+)/)
    if (!match) {
      wx.showToast({ title: 'GitHub 链接格式不对', icon: 'none' })
      return
    }

    const owner = match[1]
    const repo = match[2]
    wx.showLoading({ title: 'AI 读取中...' })

    try {
      const res = await generateAI('fetchProjectReadme', { owner, repo })
      wx.hideLoading()
      if (res && res.success && res.result) {
        const info = res.result
        const projects = this.data.projects
        projects[index] = {
          ...projects[index],
          title: info.name || projects[index].title,
          description: info.description || projects[index].description,
          tags: info.topics ? info.topics.join(', ') : projects[index].tags
        }
        this.setData({ projects })
        wx.showToast({ title: '已完善项目信息', icon: 'success' })
      } else {
        wx.showToast({ title: '读取失败', icon: 'none' })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('读取失败', error)
      wx.showToast({ title: '读取失败', icon: 'none' })
    }
  },

  // ??????????????????????
  async saveCard() {
    wx.showLoading({ title: '保存中...' });

    const cardData = this.buildCardPayload();

    try {
      await bootstrapSessionAsync();
      const result = await saveCardAsync(cardData, this.editingCardId);
      const savedCardId = result && result.cardId ? result.cardId : this.editingCardId;

      app.globalData.cardData = {
        ...cardData,
        _id: savedCardId,
        id: savedCardId
      };
      this.editingCardId = savedCardId;

      wx.hideLoading();
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (error) {
      wx.hideLoading();
      console.error('保存失败', error);
      wx.showToast({
        title: error && error.message ? error.message : '保存失败',
        icon: 'none'
      });
    }
  }
})
