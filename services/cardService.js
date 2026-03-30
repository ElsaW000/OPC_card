const { readDatabase, updateDatabase, uid, nowIso } = require('./mockDatabase')
const { getCurrentUser } = require('./userService')
const { isRemoteApiEnabled } = require('./apiConfig')
const { request } = require('./httpClient')

const TEXT = {
  devCard: '\u6280\u672f\u5f00\u53d1\u540d\u7247',
  bizCard: '\u5546\u52a1\u5408\u4f5c\u540d\u7247',
  designCard: '\u521b\u610f\u8bbe\u8ba1\u540d\u7247',
  genericCard: '\u901a\u7528\u540d\u7247',
  missingCard: '\u540d\u7247\u4e0d\u5b58\u5728',
  keepOne: '\u81f3\u5c11\u4fdd\u7559\u4e00\u5f20\u540d\u7247',
  sourcePage: '\u9875\u9762\u8bbf\u95ee',
  justNow: '\u521a\u521a'
}

function buildCardMeta(cardData = {}) {
  const template = cardData.template || 'universal'
  const metaMap = {
    developer: { type: 'tech', typeIcon: 'card', title: TEXT.devCard },
    boss: { type: 'biz', typeIcon: 'briefcase', title: TEXT.bizCard },
    designer: { type: 'design', typeIcon: 'palette', title: TEXT.designCard },
    universal: { type: 'tech', typeIcon: 'card', title: TEXT.genericCard }
  }
  return metaMap[template] || metaMap.universal
}

function normalizeRemoteCard(card = {}) {
  return {
    _id: card.id,
    id: card.id,
    template: card.template || 'universal',
    title: card.title || TEXT.genericCard,
    isDefault: !!card.is_default,
    name: card.name || '',
    role: card.role || '',
    company: card.company || '',
    bannerUrl: card.banner_url || '',
    avatarUrl: card.avatar_url || '',
    ...buildCardMeta({ template: card.template, title: card.title })
  }
}

function getCards() {
  const user = getCurrentUser()
  const db = readDatabase()
  const cards = db.cards.filter((item) => item.userId === user.userId)
  return {
    success: true,
    data: cards,
    defaultCard: cards.find((item) => item.isDefault) || cards[0] || null,
    mode: 'local-storage'
  }
}

async function getCardsAsync() {
  if (!isRemoteApiEnabled()) {
    return getCards()
  }
  const user = getCurrentUser()
  const result = await request({
    url: '/cards',
    method: 'GET',
    userId: user.userId,
  })
  const data = (result.items || []).map(normalizeRemoteCard)
  return {
    success: true,
    data,
    defaultCard: data.find((item) => item.isDefault) || data[0] || null,
    mode: 'remote-api'
  }
}

function getCard(cardId = '') {
  const result = getCards()
  if (!cardId) {
    return {
      success: true,
      data: result.defaultCard || null,
      isOwner: true,
      mode: result.mode
    }
  }

  const card = result.data.find((item) => item._id === cardId)
  return {
    success: !!card,
    data: card || null,
    isOwner: !!card,
    error: card ? '' : TEXT.missingCard,
    mode: result.mode
  }
}

function mapCardPayload(cardData = {}) {
  return {
    template: cardData.template || 'universal',
    title: cardData.title || buildCardMeta(cardData).title,
    is_default: !!cardData.isDefault,
    name: cardData.name || '',
    name_en: cardData.nameEn || '',
    role: cardData.role || '',
    bio: cardData.bio || '',
    company: cardData.company || '',
    business: cardData.business || '',
    cooperation: cardData.cooperation || '',
    location_country: cardData.locationCountry || '',
    location_city: cardData.locationCity || '',
    wechat: cardData.wechat || '',
    phone: cardData.phone || '',
    email: cardData.email || '',
    github_url: cardData.githubUrl || '',
    twitter_url: cardData.twitterUrl || '',
    banner_url: cardData.bannerUrl || '',
    avatar_url: cardData.avatarUrl || '',
    years: cardData.years || '',
    tech_stack: cardData.techStack || '',
    products_count: cardData.products || '',
    users_count: cardData.users || '',
    footer_title: cardData.footerTitle || '',
    footer_desc: cardData.footerDesc || '',
  }
}

function saveCard(cardData = {}, cardId = '') {
  const user = getCurrentUser()
  const projects = Array.isArray(cardData.projects) ? cardData.projects : []
  const videos = Array.isArray(cardData.videos) ? cardData.videos : []
  const customCards = Array.isArray(cardData.customCards) ? cardData.customCards : []
  let finalCardId = cardId

  updateDatabase((db) => {
    const ownCards = db.cards.filter((item) => item.userId === user.userId)
    const baseData = {
      ...buildCardMeta(cardData),
      ...cardData,
      projects,
      videos,
      customCards,
      template: cardData.template || 'universal',
      updatedAt: nowIso()
    }

    if (cardId) {
      db.cards = db.cards.map((item) => {
        if (item._id !== cardId || item.userId !== user.userId) {
          return item
        }
        return {
          ...item,
          ...baseData
        }
      })
      return db
    }

    finalCardId = uid('card')
    db.cards.unshift({
      _id: finalCardId,
      userId: user.userId,
      isDefault: ownCards.length === 0,
      createdAt: nowIso(),
      ...baseData
    })
    return db
  })

  return {
    success: true,
    cardId: finalCardId,
    mode: 'local-storage'
  }
}

async function saveCardAsync(cardData = {}, cardId = '') {
  if (!isRemoteApiEnabled()) {
    return saveCard(cardData, cardId)
  }
  const user = getCurrentUser()
  const payload = mapCardPayload(cardData)
  const result = cardId
    ? await request({ url: `/cards/${cardId}`, method: 'PUT', data: payload, userId: user.userId })
    : await request({ url: '/cards', method: 'POST', data: payload, userId: user.userId })
  return {
    success: true,
    cardId: result.card_id || cardId,
    mode: 'remote-api'
  }
}

function setDefaultCard(cardId) {
  const user = getCurrentUser()
  updateDatabase((db) => {
    db.cards = db.cards.map((item) => {
      if (item.userId !== user.userId) return item
      return {
        ...item,
        isDefault: item._id === cardId,
        updatedAt: nowIso()
      }
    })
    return db
  })

  return { success: true, mode: 'local-storage' }
}

async function setDefaultCardAsync(cardId) {
  if (!isRemoteApiEnabled()) {
    return setDefaultCard(cardId)
  }
  const user = getCurrentUser()
  await request({ url: `/cards/${cardId}/set-default`, method: 'POST', userId: user.userId })
  return { success: true, mode: 'remote-api' }
}

function deleteCard(cardId) {
  const user = getCurrentUser()
  const db = readDatabase()
  const ownCards = db.cards.filter((item) => item.userId === user.userId)
  if (ownCards.length <= 1) {
    return { success: false, error: TEXT.keepOne }
  }

  updateDatabase((draft) => {
    const deleting = draft.cards.find((item) => item._id === cardId && item.userId === user.userId)
    draft.cards = draft.cards.filter((item) => !(item._id === cardId && item.userId === user.userId))
    if (deleting && deleting.isDefault) {
      const nextCard = draft.cards.find((item) => item.userId === user.userId)
      if (nextCard) {
        nextCard.isDefault = true
        nextCard.updatedAt = nowIso()
      }
    }
    return draft
  })

  return { success: true, mode: 'local-storage' }
}

async function deleteCardAsync(cardId) {
  if (!isRemoteApiEnabled()) {
    return deleteCard(cardId)
  }
  const user = getCurrentUser()
  await request({ url: `/cards/${cardId}`, method: 'DELETE', userId: user.userId })
  return { success: true, mode: 'remote-api' }
}

function getCardView(cardId = '', source = TEXT.sourcePage, recordVisit = true, asVisitor = false) {
  const user = getCurrentUser()
  const cardResult = getCard(cardId)
  if (!cardResult.success || !cardResult.data) {
    return cardResult
  }

  if (recordVisit && cardId) {
    updateDatabase((db) => {
      const existing = db.visitors.find((item) => item.cardId === cardId && item.ownerUserId === user.userId)
      if (existing) {
        existing.visitCount = (existing.visitCount || 1) + 1
        existing.visitTimeText = TEXT.justNow
        existing.source = source
        existing.updatedAt = nowIso()
      }
      return db
    })
  }

  return {
    success: true,
    data: cardResult.data,
    isOwner: !asVisitor,
    mode: 'local-storage'
  }
}

async function getCardViewAsync(cardId = '', source = TEXT.sourcePage, recordVisit = true, asVisitor = false) {
  if (!isRemoteApiEnabled()) {
    return getCardView(cardId, source, recordVisit, asVisitor)
  }
  if (!cardId) {
    const cards = await getCardsAsync()
    return {
      success: true,
      data: cards.defaultCard || null,
      isOwner: !asVisitor,
      mode: 'remote-api'
    }
  }
  const result = await request({ url: `/cards/${cardId}/view`, method: 'GET' })
  return {
    success: true,
    data: result.data,
    isOwner: !asVisitor,
    mode: 'remote-api'
  }
}

module.exports = {
  getCards,
  getCardsAsync,
  getCard,
  saveCard,
  saveCardAsync,
  setDefaultCard,
  setDefaultCardAsync,
  deleteCard,
  deleteCardAsync,
  getCardView,
  getCardViewAsync,
}