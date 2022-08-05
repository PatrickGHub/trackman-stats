const axios = require('axios')

const baseUrl = 'https://api.trackmanrange.com/api'
const bearerToken = ''

axios.defaults.headers.common['Authorization'] = `Bearer ${bearerToken}`

const getStrokes = async (url, storedData) => {
  const { data } = await axios.get(url)
  storedData = [...storedData, data]

  if (url !== data._links.last.href) {
    return await getStrokes(data._links.next.href, storedData)
  }

  return storedData
}

const handler = async () => {
  const { data: sessionsData } = await axios.get(`${baseUrl}/activities`)
  let sessions = sessionsData?.items

  sessions.forEach(async (session) => {
    const strokes = await getStrokes(session._links.strokes.href, [])
    console.log(JSON.stringify(strokes, null, 2))
  })
}

module.exports = {
  handler
}