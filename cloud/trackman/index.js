const fs = require('fs')
const axios = require('axios')
const AWS = require('aws-sdk')

const s3 = new AWS.S3()

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
  let filteredSessions = []

  for (const session of sessions) {
    console.log(`Looking at individual session data: ${session.id}`)
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
    for (const strokePage of strokePages) {
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
    }

    console.log('Adding session to sessions array')
    filteredSessions = [...filteredSessions, filteredSession]
  }

  console.log('Writing session data to file in S3')
  await s3.putObject({
    Bucket: 'trackman-bucket',
    Key: 'sessions.json',
    Body: JSON.stringify(filteredSessions)
  }).promise()
}

module.exports = {
  handler
}