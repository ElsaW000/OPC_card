const cloud = require('wx-server-sdk')

cloud.init()

exports.main = async (event) => {
  const db = cloud.database()
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { contactId } = event

  try {
    const contact = await db.collection('contacts').doc(contactId).get()

    if (!contact.data || contact.data.ownerOpenid !== openid) {
      return {
        success: false,
        error: 'No permission for this contact'
      }
    }

    return {
      success: true,
      data: contact.data
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}