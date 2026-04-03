// edit.js - æŒ‰ç…§ Figma è®¾è®¡é‡æž„

const app = getApp()
const { saveCardAsync, getCardViewAsync } = require('../../services/cardService')
const { bootstrapSessionAsync } = require('../../services/userService')
const { generateAI } = require('../../services/aiService')
const { readSettings } = require('../../services/settingsService')

function toStringValue(value, fallback = '') {
  return value === undefined || value === null ? fallback : String(value)
}

function normalizeEditProject(project = {}, index = 0) {
  const tags = Array.isArray(project.tags)
    ? project.tags.join(', ')
    : toStringValue(project.tags)

  return {
    id: toStringValue(project.id || project._id, `project-${index}`),
    title: toStringValue(project.title),
    description: toStringValue(project.description),
    thumbnail: toStringValue(project.thumbnail || project.thumbnailUrl),
    link: toStringValue(project.link || project.linkUrl),
    github: toStringValue(project.github || project.githubUrl),
    tags,
  }
}

function normalizeEditVideo(video = {}, index = 0) {
  return {
    id: toStringValue(video.id || video._id, `video-${index}`),
    title: toStringValue(video.title),
    thumbnail: toStringValue(video.thumbnail || video.thumbnailUrl),
    link: toStringValue(video.link || video.linkUrl),
    views: toStringValue(video.views || video.viewsText),
    duration: toStringValue(video.duration || video.durationText),
  }
}

function normalizeEditCustomCard(item = {}, index = 0) {
  return {
    id: toStringValue(item.id || item._id, `custom-${index}`),
    title: toStringValue(item.title),
    content: toStringValue(item.content),
  }
}

function buildAiContextPayload(data = {}) {
  const settings = readSettings()
  return {
    allowContactsContext: !!(settings && settings.allowAiContactsContext),
    selfProfileDraft: {
      name: toStringValue(data.name),
      role: toStringValue(data.role),
      company: toStringValue(data.company),
      bio: toStringValue(data.bio),
      locationCountry: toStringValue(data.locationCountry),
      locationCity: toStringValue(data.locationCity),
      years: toStringValue(data.years),
      techStack: toStringValue(data.techStack),
      business: toStringValue(data.business),
      cooperation: toStringValue(data.cooperation),
      projects: Array.isArray(data.projects) ? data.projects : [],
      customCards: Array.isArray(data.customCards) ? data.customCards : [],
    },
  }
}

// æ¨¡æ¿é…ç½®
const TEMPLATES = {
  universal: {
    id: 'universal',
    name: 'é€šç”¨',
    fields: ['name', 'role', 'location', 'bio', 'phone', 'email', 'githubUrl', 'twitterUrl']
  },
  developer: {
    id: 'developer',
    name: 'ç¨‹åºå‘˜',
    fields: ['name', 'role', 'location', 'bio', 'years', 'techStack', 'projects', 'githubUrl', 'phone', 'email']
  },
  designer: {
    id: 'designer',
    name: 'è®¾è®¡å¸ˆ',
    fields: ['name', 'role', 'location', 'bio', 'portfolio', 'styles', 'experience', 'phone', 'email', 'twitterUrl']
  },
  boss: {
    id: 'boss',
    name: 'è€æ¿',
    fields: ['name', 'role', 'company', 'business', 'cooperation', 'bio', 'phone', 'email', 'wechat']
  }
}

Page({
  data: {
    // æ¨¡æ¿é€‰æ‹©
    currentTemplate: 'universal',
    templates: TEMPLATES,
    
    // AI è¾“å…¥
    aiInput: '',
    
    // è‡ªå®šä¹‰å¡ç‰‡
    customCards: [],
    
    // Banner & å¤´åƒ
    bannerUrl: 'https://images.unsplash.com/photo-1647247743538-0137d6a8a268?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    avatarUrl: 'https://images.unsplash.com/photo-1701463387028-3947648f1337?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
    
    // åŸºæœ¬ä¿¡æ¯
    name: '',
    nameEn: '', // è‹±æ–‡å
    locationCountry: '', // å›½å®¶
    locationCity: '', // çœå¸‚
    bio: '',
    
    // ç¨‹åºå‘˜å­—æ®µ
    years: '',
    techStack: '',
    
    // è®¾è®¡å¸ˆå­—æ®µ
    portfolio: '',
    styles: '',
    experience: '',
    
    // è€æ¿å­—æ®µ
    company: '',
    business: '',
    cooperation: '',
    wechat: '',
    
    // ç¤¾äº¤é“¾æŽ¥
    githubUrl: '',
    twitterUrl: '',
    
    // æ•°æ®ç»Ÿè®¡
    products: '',
    users: '',
    
    // è”ç³»æ–¹å¼
    phone: '',
    email: '',
    
    // äº§å“/é¡¹ç›®
    projects: [],
    
    // è§†é¢‘/çŸ­è§†é¢‘
    videos: [],
    
    // åº•éƒ¨è‡ªå®šä¹‰è”ç³»æ¨¡å—
    footerTitle: '联系我',
    footerDesc: '如有合作意向，欢迎通过以下方式联系',
    
    // AI æŽ¨èæ ‡ç­¾
    suggestedTags: []
  },

  async onLoad(options) {
    const globalData = app.globalData.cardData || null;
    const isNew = !globalData && !(options && options.id);
    const sourceBase = globalData || this.getEmptyData();
    this.editingCardId = (options && options.id) || (globalData && (globalData._id || globalData.id)) || '';

    let sourceData = sourceBase;
    if (this.editingCardId) {
      try {
        await bootstrapSessionAsync();
        const result = await getCardViewAsync(this.editingCardId);
        if (result && result.success && result.data) {
          sourceData = {
            ...sourceData,
            ...result.data,
          };
          app.globalData.cardData = sourceData;
        }
      } catch (error) {
        console.error('load edit card failed:', error);
      }
    }

    this.setData(this.buildSafeLoadedData(sourceData));
  },

  buildSafeLoadedData(cardData = {}) {
    return {
      currentTemplate: cardData.template || cardData.currentTemplate || this.data.currentTemplate,
      aiInput: toStringValue(cardData.aiInput),
      customCards: Array.isArray(cardData.customCards) ? cardData.customCards.map(normalizeEditCustomCard) : [],
      bannerUrl: toStringValue(cardData.bannerUrl, this.data.bannerUrl),
      avatarUrl: toStringValue(cardData.avatarUrl, this.data.avatarUrl),
      name: toStringValue(cardData.name),
      nameEn: toStringValue(cardData.nameEn),
      role: toStringValue(cardData.role),
      locationCountry: toStringValue(cardData.locationCountry),
      locationCity: toStringValue(cardData.locationCity),
      bio: toStringValue(cardData.bio),
      years: toStringValue(cardData.years),
      techStack: toStringValue(cardData.techStack),
      portfolio: toStringValue(cardData.portfolio),
      styles: toStringValue(cardData.styles),
      experience: toStringValue(cardData.experience),
      company: toStringValue(cardData.company),
      business: toStringValue(cardData.business),
      cooperation: toStringValue(cardData.cooperation),
      wechat: toStringValue(cardData.wechat),
      githubUrl: toStringValue(cardData.githubUrl),
      twitterUrl: toStringValue(cardData.twitterUrl),
      products: toStringValue(cardData.products),
      users: toStringValue(cardData.users),
      phone: toStringValue(cardData.phone),
      email: toStringValue(cardData.email),
      projects: Array.isArray(cardData.projects) ? cardData.projects.map(normalizeEditProject) : [],
      videos: Array.isArray(cardData.videos) ? cardData.videos.map(normalizeEditVideo) : [],
      footerTitle: toStringValue(cardData.footerTitle),
      footerDesc: toStringValue(cardData.footerDesc),
      suggestedTags: Array.isArray(cardData.suggestedTags) ? cardData.suggestedTags.map((tag) => toStringValue(tag)).filter(Boolean) : [],
      privacy: {
        contact: cardData.privacy && cardData.privacy.contact !== undefined ? !!cardData.privacy.contact : false,
        projects: cardData.privacy && cardData.privacy.projects !== undefined ? !!cardData.privacy.projects : true,
        videos: cardData.privacy && cardData.privacy.videos !== undefined ? !!cardData.privacy.videos : true,
        custom: cardData.privacy && cardData.privacy.custom !== undefined ? !!cardData.privacy.custom : true,
        footer: cardData.privacy && cardData.privacy.footer !== undefined ? !!cardData.privacy.footer : true,
        stats: cardData.privacy && cardData.privacy.stats !== undefined ? !!cardData.privacy.stats : true
      }
    };
  },

  getEmptyData() {
    return {
      bannerUrl: this.data.bannerUrl,
      avatarUrl: this.data.avatarUrl,
      name: '',
      nameEn: '',
      role: '',
      locationCountry: '',
      locationCity: '',
      bio: '',
      githubUrl: '',
      twitterUrl: '',
      years: '',
      products: '',
      users: '',
      phone: '',
      email: '',
      projects: [],
      videos: [],
      customCards: [],
      company: '',
      business: '',
      cooperation: '',
      wechat: '',
      techStack: '',
      portfolio: '',
      styles: '',
      experience: '',
      footerTitle: '',
      footerDesc: '',
      suggestedTags: []
    };
  },

  buildCardPayload() {
    const projects = Array.isArray(this.data.projects)
      ? this.data.projects.map((project, index) => ({
          id: project.id || `project-${index}`,
          title: toStringValue(project.title),
          description: toStringValue(project.description),
          thumbnail: toStringValue(project.thumbnail || project.thumbnailUrl),
          link: toStringValue(project.link || project.linkUrl),
          github: toStringValue(project.github || project.githubUrl),
          tags: Array.isArray(project.tags)
            ? project.tags
            : (project.tags ? String(project.tags).split(',').map((tag) => tag.trim()).filter(Boolean) : [])
        }))
      : []

    const videos = Array.isArray(this.data.videos)
      ? this.data.videos.map((video, index) => ({
          id: video.id || `video-${index}`,
          title: toStringValue(video.title),
          thumbnail: toStringValue(video.thumbnail || video.thumbnailUrl),
          link: toStringValue(video.link || video.linkUrl),
          views: toStringValue(video.views || video.viewsText),
          duration: toStringValue(video.duration || video.durationText)
        }))
      : []

    const customCards = Array.isArray(this.data.customCards)
      ? this.data.customCards.map((item, index) => ({
          id: item.id || `custom-${index}`,
          title: toStringValue(item.title),
          content: toStringValue(item.content)
        }))
      : []

    return {
      template: this.data.currentTemplate,
      customCards,
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
      videos,
      footerTitle: this.data.footerTitle,
      footerDesc: this.data.footerDesc,
      privacy: this.data.privacy
    };
  },

  // è¾“å…¥æ¡†å˜åŒ–
  onPrivacyToggle(e) {
    const key = e.currentTarget.dataset.key;
    const value = e.detail.value;
    this.setData({
      [`privacy.${key}`]: value
    });
  },

  onInputChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [field]: e.detail.value
    });
  },

  // é€‰æ‹©å›¾ç‰‡
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

  // æ·»åŠ äº§å“
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

  // åˆ é™¤äº§å“
  removeProject(e) {
    const index = e.currentTarget.dataset.index;
    const projects = this.data.projects;
    projects.splice(index, 1);
    this.setData({ projects });
  },

  // äº§å“è¾“å…¥å˜åŒ–
  onProjectChange(e) {
    const index = e.currentTarget.dataset.index;
    const field = e.currentTarget.dataset.field;
    const projects = this.data.projects;
    projects[index][field] = e.detail.value;
    this.setData({ projects });
  },

  // é€‰æ‹©æ¨¡æ¿
  selectTemplate(e) {
    const templateId = e.currentTarget.dataset.id;
    this.setData({
      currentTemplate: templateId
    });
  },

  // æ·»åŠ è‡ªå®šä¹‰å¡ç‰‡
  addCustomCard() {
    const customCards = this.data.customCards;
    customCards.push({
      id: Date.now().toString(),
      title: '',
      content: ''
    });
    this.setData({ customCards });
  },

  // æ·»åŠ è§†é¢‘
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

  // åˆ é™¤è§†é¢‘
  removeVideo(e) {
    const index = e.currentTarget.dataset.index;
    const videos = this.data.videos;
    videos.splice(index, 1);
    this.setData({ videos });
  },

  // è§†é¢‘è¾“å…¥å˜åŒ–
  onVideoChange(e) {
    const index = e.currentTarget.dataset.index;
    const field = e.currentTarget.dataset.field;
    const videos = this.data.videos;
    videos[index][field] = e.detail.value;
    this.setData({ videos });
  },

  // åˆ é™¤è‡ªå®šä¹‰å¡ç‰‡
  removeCustomCard(e) {
    const index = e.currentTarget.dataset.index;
    const customCards = this.data.customCards;
    customCards.splice(index, 1);
    this.setData({ customCards });
  },

  // è‡ªå®šä¹‰å¡ç‰‡è¾“å…¥å˜åŒ–
  onCustomCardChange(e) {
    const index = e.currentTarget.dataset.index;
    const field = e.currentTarget.dataset.field;
    const customCards = this.data.customCards;
    customCards[index][field] = e.detail.value;
    this.setData({ customCards });
  },

  // AI ä¸€é”®ç”Ÿæˆï¼ˆä»Žæ–‡å­—æå–å­—æ®µï¼‰
  async generateFromAI() {
    if (!this.data.aiInput) {
      wx.showToast({ title: '请先输入一段关于你的介绍', icon: 'none' })
      return
    }

    wx.showLoading({ title: 'AI 识别中...' })

    try {
      const res = await generateAI('extract', {
        text: this.data.aiInput,
        ...buildAiContextPayload(this.data),
      })
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
          customCards: Array.isArray(extracted.tags) && extracted.tags.length
            ? [{ id: 'ai-tags', title: '标签', content: extracted.tags.join(', ') }]
            : this.data.customCards
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
    wx.showLoading({ title: 'AI ç”Ÿæˆä¸­...' })

    try {
      const res = await generateAI('generateIntro', {
        role: this.data.role,
        locationCity: this.data.locationCity,
        techStack: this.data.techStack,
        ...buildAiContextPayload(this.data),
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
      const res = await generateAI('optimize', {
        bio: this.data.bio,
        ...buildAiContextPayload(this.data),
      })
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
      const res = await generateAI('tags', {
        identity: this.data.role,
        ...buildAiContextPayload(this.data),
      })
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
    // TODO: å°†æ ‡ç­¾æ·»åŠ åˆ°å¯¹åº”å­—æ®µ
    wx.showToast({ title: '已添加: ' + tag, icon: 'none' })
  },

  // AI è¯»å– GitHub é¡¹ç›®
  async fetchGitHubProjects() {
    if (!this.data.githubUrl) {
      wx.showToast({ title: 'è¯·å…ˆå¡«å†™ GitHub åœ°å€', icon: 'none' })
      return
    }

    const match = this.data.githubUrl.match(/github\.com\/([^\/]+)/)
    if (!match) {
      wx.showToast({ title: 'GitHub åœ°å€æ ¼å¼ä¸å¯¹', icon: 'none' })
      return
    }

    const username = match[1]
    wx.showLoading({ title: 'AI è¯»å–ä¸­...' })

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
        wx.showToast({ title: `å·²æ·»åŠ  ${projects.length} 个项目`, icon: 'success' })
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
      wx.showToast({ title: 'è¯·å…ˆå¡«å†™ GitHub é“¾æŽ¥', icon: 'none' })
      return
    }

    const match = project.github.match(/github\.com\/([^\/]+)\/([^\/]+)/)
    if (!match) {
      wx.showToast({ title: 'GitHub é“¾æŽ¥æ ¼å¼ä¸å¯¹', icon: 'none' })
      return
    }

    const owner = match[1]
    const repo = match[2]
    wx.showLoading({ title: 'AI è¯»å–ä¸­...' })

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
        wx.showToast({ title: 'å·²å®Œå–„é¡¹ç›®ä¿¡æ¯', icon: 'success' })
      } else {
        wx.showToast({ title: 'è¯»å–å¤±è´¥', icon: 'none' })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('è¯»å–å¤±è´¥', error)
      wx.showToast({ title: 'è¯»å–å¤±è´¥', icon: 'none' })
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
