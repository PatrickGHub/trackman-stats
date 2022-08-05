const fs = require('fs')
const axios = require('axios')

const { bearerToken } = require('./token.json')
const baseUrl = 'https://api.trackmanrange.com/api'

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
  console.log('Getting all sessions')
  const { data: sessionsData } = await axios.get(`${baseUrl}/activities`)
  const sessions = sessionsData?.items

  sessions.forEach(async (session) => {
    console.log('Looking at individual session data')
    const filteredSession = {
      id: session.id,
      facility: session.facility.name,
      playType: session.kind,
      bay: session.bays[0].name,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      strokes: []
    }

    console.log('Getting all strokes from session')
    const strokePages = await getStrokes(session._links.strokes.href, [])

    console.log('Assigning stroke data to session')
    strokePages.forEach((strokePage) => {
      strokePage.items.map((stroke) => {
        const filteredStroke = {
          id: stroke.id,
          proBallMeasurement: stroke.proBallMeasurement,
          club: stroke.club,
          bay: stroke.bayName,
          createdAt: stroke.createdAt
        }
        return filteredSession.strokes = [...filteredSession.strokes, filteredStroke]
      })
    })

    console.log('Writing session data to file')
    fs.writeFile('./output.json', JSON.stringify(filteredSession, null, 2), (err) => {
      if (err) return console.error(err)
    })
  })
}

module.exports = {
  handler
}