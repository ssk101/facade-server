import error from 'http-errors'

export default async function(data, res) {
  if(data.ok) {
    var data
    const contentType = data.headers.get('content-type')

    if(contentType.includes('image')) {
      res.set({ 'Content-Type': 'image/png' })
      return data
    } else {
      data = await data.json()
      return data
    }
  } else {
    if(data.status === 404) {
      throw error.NotFound(data.status, data.statusText)
    }

    throw error.InternalServerError(data.status, data.statusText)
  }
}
