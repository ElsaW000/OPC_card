function getErrorMessage(error, fallback = '\u8bf7\u6c42\u5931\u8d25') {
  if (!error) return fallback
  if (typeof error === 'string') return error
  if (error.message && typeof error.message === 'string') return error.message
  if (error.errMsg && typeof error.errMsg === 'string') return error.errMsg
  if (error.detail && typeof error.detail === 'string') return error.detail
  if (error.error && typeof error.error === 'string') return error.error
  if (Array.isArray(error.errors) && error.errors.length > 0) {
    return getErrorMessage(error.errors[0], fallback)
  }
  if (error.raw) {
    return getErrorMessage(error.raw, fallback)
  }
  try {
    const serialized = JSON.stringify(error)
    return serialized && serialized !== '{}' ? serialized : fallback
  } catch (jsonError) {
    return fallback
  }
}

function normalizeError(error, fallback = '\u8bf7\u6c42\u5931\u8d25') {
  const message = getErrorMessage(error, fallback)
  if (error && typeof error === 'object') {
    return {
      ...error,
      message
    }
  }
  return { message }
}

module.exports = {
  getErrorMessage,
  normalizeError,
}
