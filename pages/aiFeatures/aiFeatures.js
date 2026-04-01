const { generateAI, getAIProvider, setAIProvider } = require('../../services/aiService')
const { bootstrapSessionAsync } = require('../../services/userService')
const { isRemoteApiEnabled, setRemoteApiEnabled } = require('../../services/apiConfig')
const { readSettings } = require('../../services/settingsService')

const CONNECTING_HINT_DELAY = 2000
const SLOW_HINT_DELAY = 8000
const REPLY_STREAM_DELAY = 32
const REPLY_STREAM_CHUNK_SIZE = 6

const QUICK_PROMPTS = [
  '\u5e2e\u6211\u4f18\u5316\u540d\u7247\u7684\u4e2a\u4eba\u7b80\u4ecb',
  '\u63a8\u8350\u9002\u5408\u6211\u7684\u540d\u7247\u6807\u7b7e',
  '\u5982\u4f55\u8ba9\u540d\u7247\u66f4\u5177\u5438\u5f15\u529b\uff1f',
  '\u5e2e\u6211\u8bbe\u8ba1\u4e00\u4e2a\u81ea\u6211\u4ecb\u7ecd\u8bed\u53e5'
]

const WELCOME_MSG = {
  id: 'welcome',
  role: 'assistant',
  content: '\u4f60\u597d\uff01\u6211\u662f\u4f60\u7684 eSeat AI \u52a9\u624b\uff0c\u53ef\u4ee5\u5e2e\u4f60\u4f18\u5316\u540d\u7247\u5185\u5bb9\u3001\u751f\u6210\u6807\u7b7e\u3001\u63d0\u5347\u4e2a\u4eba\u5c55\u793a\u3002\u6709\u4ec0\u4e48\u9700\u8981\u6211\u5e2e\u5fd9\uff1f',
  time: ''
}

function nowTime() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function makeId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function makeTraceId() {
  return `trace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function formatTimestamp(ms) {
  if (!ms) return '--'
  const d = new Date(ms)
  const pad = (value) => String(value).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, '0')}`
}

function durationBetween(endValue, startValue) {
  if (typeof endValue !== 'number' || typeof startValue !== 'number') return null
  return endValue - startValue
}

Page({
  data: {
    messages: [{ ...WELCOME_MSG, time: '' }],
    inputText: '',
    loading: false,
    loadingStatusText: '',
    slowHintVisible: false,
    contactsContextEnabled: false,
    replySourceText: '',
    scrollTarget: '',
    perfInfo: null,
    quickPrompts: QUICK_PROMPTS,
    aiProvider: 'qwen',
    providerOptions: [
      { value: 'qwen', label: 'Qwen' },
      { value: 'minimax', label: 'Minimax' }
    ]
  },

  onLoad() {
    this._destroyed = false
    const settings = readSettings()
    this.setData({
      aiProvider: getAIProvider(),
      contactsContextEnabled: !!settings.allowAiContactsContext,
    })
    this._ensureAiReady().catch(() => {})
  },

  onShow() {
    const settings = readSettings()
    this._safeSetData({ contactsContextEnabled: !!settings.allowAiContactsContext })
  },

  onProviderSelect(e) {
    const provider = e.currentTarget.dataset.provider || 'qwen'
    this.setData({ aiProvider: setAIProvider(provider) })
    wx.showToast({ title: `已切换到 ${provider}`, icon: 'none' })
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value })
  },


  onQuickPrompt(e) {
    const text = e.currentTarget.dataset.text
    this.setData({ inputText: text }, () => {
      this.sendMessage()
    })
  },

  async sendMessage() {
    const text = (this.data.inputText || '').trim()
    if (!text || this.data.loading) return
    const frontendClickedAtMs = Date.now()
    const traceId = makeTraceId()

    const userMsg = {
      id: makeId(),
      role: 'user',
      content: text,
      time: nowTime()
    }

    const messages = [...this.data.messages, userMsg]
    this._safeSetData({
      messages,
      inputText: '',
      loading: true,
      loadingStatusText: '正在思考',
      slowHintVisible: false,
      scrollTarget: 'chat-bottom'
    })
    this._startLoadingFeedback()

    try {
      await this._ensureAiReady()

      const res = await generateAI('chat', {
        message: text,
        allowContactsContext: !!this.data.contactsContextEnabled,
        trace: {
          traceId,
          frontendClickedAtMs,
        },
      })
      const reply = (res && res.success && res.result && res.result.reply)
        ? res.result.reply
        : this._fallbackReply(text)
      const responseTrace = (res && res.meta && res.meta.trace) || { traceId, frontendClickedAtMs }
      const frontendResponseReceivedAtMs = Date.now()
      const isLocalFallback = !!(res && res.meta && res.meta.localFallback)
      const replySourceText = isLocalFallback ? '当前回复来自本地兜底建议（模型暂不可用）' : '当前回复来自在线模型'
      if (isLocalFallback) {
        wx.showToast({ title: '模型暂不可用，已降级本地建议', icon: 'none' })
      }

      const aiMsg = {
        id: makeId(),
        role: 'assistant',
        content: '',
        time: nowTime()
      }
      await new Promise((resolve) => {
        this._safeSetData({
          messages: [...this.data.messages, aiMsg],
          loading: false,
          loadingStatusText: '',
          slowHintVisible: false,
          scrollTarget: 'chat-bottom'
        }, async () => {
          if (this._destroyed) {
            resolve()
            return
          }
          await this._streamAssistantReply(aiMsg.id, reply)
          const perfInfo = this._buildPerfInfo(responseTrace, frontendResponseReceivedAtMs, Date.now(), isLocalFallback)
          console.info('AI trace', perfInfo)
          this._safeSetData({ perfInfo, replySourceText }, resolve)
        })
      })
    } catch (error) {
      console.error('AI chat failed:', error)
      const aiMsg = {
        id: makeId(),
        role: 'assistant',
        content: '',
        time: nowTime()
      }
      const fallbackReply = this._fallbackReply(text)
      await new Promise((resolve) => {
        this._safeSetData({
          messages: [...this.data.messages, aiMsg],
          loading: false,
          loadingStatusText: '',
          slowHintVisible: false,
          scrollTarget: 'chat-bottom'
        }, async () => {
          if (this._destroyed) {
            resolve()
            return
          }
          const frontendResponseReceivedAtMs = Date.now()
          await this._streamAssistantReply(aiMsg.id, fallbackReply)
          const perfInfo = this._buildPerfInfo({ traceId, frontendClickedAtMs }, frontendResponseReceivedAtMs, Date.now(), true)
          console.info('AI trace', perfInfo)
          this._safeSetData({ perfInfo, replySourceText: '当前回复来自本地兜底建议（模型暂不可用）' }, resolve)
        })
      })
    } finally {
      this._stopLoadingFeedback()
    }
  },

  onUnload() {
    this._destroyed = true
    if (this._replyStreamTimer) {
      clearTimeout(this._replyStreamTimer)
      this._replyStreamTimer = null
    }
    this._stopLoadingFeedback()
  },

  _safeSetData(update, callback) {
    if (this._destroyed) {
      if (typeof callback === 'function') callback()
      return false
    }
    this.setData(update, callback)
    return true
  },

  _ensureAiReady() {
    if (this._aiReadyPromise) {
      return this._aiReadyPromise
    }
    if (this._aiReady) {
      return Promise.resolve(true)
    }

    this._aiReadyPromise = (async () => {
      if (!isRemoteApiEnabled()) {
        setRemoteApiEnabled(true)
      }
      await bootstrapSessionAsync()
      this._aiReady = true
      return true
    })().finally(() => {
      this._aiReadyPromise = null
    })

    return this._aiReadyPromise
  },

  _startLoadingFeedback() {
    this._stopLoadingFeedback()
    this._connectingTimer = setTimeout(() => {
      if (this._destroyed || !this.data.loading) return
      this._safeSetData({ loadingStatusText: '正在连接模型' })
    }, CONNECTING_HINT_DELAY)
    this._slowTimer = setTimeout(() => {
      if (this._destroyed || !this.data.loading) return
      this._safeSetData({
        loadingStatusText: '响应较慢，可重试或先看本地建议',
        slowHintVisible: true,
      })
    }, SLOW_HINT_DELAY)
  },

  _stopLoadingFeedback() {
    if (this._connectingTimer) {
      clearTimeout(this._connectingTimer)
      this._connectingTimer = null
    }
    if (this._slowTimer) {
      clearTimeout(this._slowTimer)
      this._slowTimer = null
    }
  },

  _streamAssistantReply(messageId, fullText) {
    const targetText = String(fullText || '')
    if (!targetText) {
      return Promise.resolve()
    }

    if (this._replyStreamTimer) {
      clearTimeout(this._replyStreamTimer)
      this._replyStreamTimer = null
    }

    return new Promise((resolve) => {
      let index = 0
      const step = () => {
        if (this._destroyed) {
          this._replyStreamTimer = null
          resolve()
          return
        }
        index = Math.min(index + REPLY_STREAM_CHUNK_SIZE, targetText.length)
        this._updateMessageContent(messageId, targetText.slice(0, index))
        if (index >= targetText.length) {
          this._replyStreamTimer = null
          resolve()
          return
        }
        this._replyStreamTimer = setTimeout(step, REPLY_STREAM_DELAY)
      }
      step()
    })
  },

  _updateMessageContent(messageId, content) {
    if (this._destroyed) {
      return
    }
    const messages = (this.data.messages || []).map((item) => {
      if (item.id !== messageId) {
        return item
      }
      return {
        ...item,
        content,
      }
    })
    this._safeSetData({
      messages,
      scrollTarget: 'chat-bottom'
    })
  },

  _buildPerfInfo(trace = {}, frontendResponseReceivedAtMs, frontendRenderedAtMs, isLocalFallback = false) {
    const perfInfo = {
      traceId: trace.traceId || '',
      frontendClickedAtMs: trace.frontendClickedAtMs || null,
      backendReceivedAtMs: trace.backendReceivedAtMs || null,
      modelRequestStartedAtMs: trace.modelRequestStartedAtMs || null,
      modelFirstByteAtMs: trace.modelFirstByteAtMs || null,
      backendReturnedAtMs: trace.backendReturnedAtMs || null,
      frontendResponseReceivedAtMs,
      frontendRenderedAtMs,
      isLocalFallback,
    }

    perfInfo.frontendToBackendMs = trace.frontendToBackendMs != null
      ? trace.frontendToBackendMs
      : durationBetween(perfInfo.backendReceivedAtMs, perfInfo.frontendClickedAtMs)
    perfInfo.backendPrepareMs = trace.backendPrepareMs != null
      ? trace.backendPrepareMs
      : durationBetween(perfInfo.modelRequestStartedAtMs, perfInfo.backendReceivedAtMs)
    perfInfo.modelFirstByteMs = trace.modelFirstByteMs != null
      ? trace.modelFirstByteMs
      : durationBetween(perfInfo.modelFirstByteAtMs, perfInfo.modelRequestStartedAtMs)
    perfInfo.backendReturnMs = trace.backendReturnMs != null
      ? trace.backendReturnMs
      : durationBetween(perfInfo.backendReturnedAtMs, perfInfo.modelFirstByteAtMs)
    perfInfo.backendTotalMs = trace.backendTotalMs != null
      ? trace.backendTotalMs
      : durationBetween(perfInfo.backendReturnedAtMs, perfInfo.backendReceivedAtMs)
    perfInfo.frontendRenderMs = durationBetween(frontendRenderedAtMs, frontendResponseReceivedAtMs)

    perfInfo.frontendClickedAtLabel = formatTimestamp(perfInfo.frontendClickedAtMs)
    perfInfo.backendReceivedAtLabel = formatTimestamp(perfInfo.backendReceivedAtMs)
    perfInfo.modelRequestStartedAtLabel = formatTimestamp(perfInfo.modelRequestStartedAtMs)
    perfInfo.modelFirstByteAtLabel = formatTimestamp(perfInfo.modelFirstByteAtMs)
    perfInfo.backendReturnedAtLabel = formatTimestamp(perfInfo.backendReturnedAtMs)
    perfInfo.frontendResponseReceivedAtLabel = formatTimestamp(perfInfo.frontendResponseReceivedAtMs)
    perfInfo.frontendRenderedAtLabel = formatTimestamp(perfInfo.frontendRenderedAtMs)
    perfInfo.backendTraceAvailable = !!(perfInfo.backendReceivedAtMs || perfInfo.modelRequestStartedAtMs || perfInfo.modelFirstByteAtMs || perfInfo.backendReturnedAtMs)

    return perfInfo
  },

  _fallbackReply(text) {
    const lower = text.toLowerCase()
    if (lower.includes('\u7b80\u4ecb') || lower.includes('bio') || lower.includes('\u4ecb\u7ecd')) {
      return '\u5efa\u8bae\u4f60\u7684\u7b80\u4ecb\u7a81\u51fa\u4e09\u4e2a\u8981\u7d20\uff1a\u804c\u4e1a\u5b9a\u4f4d\u3001\u6838\u5fc3\u80fd\u529b\u3001\u4ee3\u8868\u6210\u679c\u3002\u4f8b\u5982\uff1a\u201c5 \u5e74\u5168\u6808\u5f00\u53d1\u7ecf\u9a8c\uff0c\u4e13\u6ce8 AI + SaaS \u4ea7\u54c1\uff0c\u672c\u773c\u4e0a\u7ebf 3 \u6b3e\u591a\u4eba\u4f7f\u7528\u7684\u5de5\u5177\u3002\u201d'
    }
    if (lower.includes('\u6807\u7b7e') || lower.includes('tag')) {
      return '\u6839\u636e\u60a8\u7684\u804c\u4e1a\u65b9\u5411\uff0c\u63a8\u8350\u6807\u7b7e\uff1aAI\u3001\u5168\u6808\u3001SaaS\u3001\u72ec\u7acb\u5f00\u53d1\u3001\u5c0f\u7a0b\u5e8f\u3002\u53ef\u4ee5\u5728\u7f16\u8f91\u9875\u76f4\u63a5\u586b\u5165\u3002'
    }
    if (lower.includes('\u5438\u5f15') || lower.includes('\u8ba9') || lower.includes('\u66f4\u597d')) {
      return '\u540d\u7247\u5438\u5f15\u529b\u6765\u81ea\u4e09\u70b9\uff1a\n1. \u6e05\u6670\u7684\u5b9a\u4f4d\uff08\u4f60\u662f\u8c01\u3001\u505a\u4ec0\u4e48\uff09\n2. \u771f\u5b9e\u7684\u5c55\u793a\uff08\u9879\u76ee\u3001\u6570\u636e\u3001\u6210\u679c\uff09\n3. \u660e\u786e\u7684\u884c\u52a8\u5165\u53e3\uff08\u8054\u7cfb\u65b9\u5f0f\u3001\u4ea4\u6362\u6309\u94ae\uff09'
    }
    if (lower.includes('\u81ea\u6211\u4ecb\u7ecd') || lower.includes('\u8bed\u53e5')) {
      return '\u8bd5\u8bd5\u8fd9\u4e2a\u6a21\u677f\uff1a\u201c\u6211\u662f\u4e00\u540d [\u804c\u4e1a]\uff0c\u4e13\u6ce8 [\u9886\u57df]\uff0c\u5e2e\u52a9 [\u76ee\u6807\u7528\u6237] [\u89e3\u51b3\u4ec0\u4e48\u95ee\u9898]\u3002\u201d\u586b\u5165\u4f60\u7684\u5177\u4f53\u4fe1\u606f\uff0c\u5c31\u80fd\u5f62\u6210\u4e00\u53e5\u8bdd\u81ea\u6211\u4ecb\u7ecd\u3002'
    }
    return '\u6211\u660e\u767d\u4f60\u7684\u9700\u6c42\uff01\u5efa\u8bae\u53ef\u4ee5\u5728\u201c\u7f16\u8f91\u540d\u7247\u201d\u9875\u9762\u4f7f\u7528 AI \u4e00\u952e\u586b\u5145\uff0c\u628a\u4f60\u7684\u4e2a\u4eba\u4ecb\u7ecd\u7c98\u8d34\u8fdb\u53bb\uff0c\u6211\u4f1a\u81ea\u52a8\u63d0\u53d6\u5173\u952e\u5b57\u6bb5\u3002'
  }
})
