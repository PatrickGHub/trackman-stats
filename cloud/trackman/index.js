const fs = require('fs')
const axios = require('axios')
const AWS = require('aws-sdk')

const s3 = new AWS.S3()

const { bearerToken } = require('./token.json')
const baseUrl = 'https://api.trackmanrange.com/api'

axios.defaults.headers.common['Authorization'] = `Bearer ${bearerToken}`

const getPaginatedData = async (url, storedData = []) => {
  const { data } = await axios.get(url)
  storedData = [...storedData, data]

  if (url !== data._links.last.href) {
    return await getPaginatedData(data._links.next.href, storedData)
  }

  return storedData
}

const handler = async () => {
  console.log('Getting all sessions')
  let sessions = await getPaginatedData(`${baseUrl}/activities`)
  sessions = sessions.flatMap((session) => {
    return session.items
  })

  let filteredSessions = []

  for (const session of sessions) {
    console.log(`Looking at individual session data: ${session.id}`)

    if (session.kind !== 'Practice') {
      console.log('Session was a game. Stroke data not available.')
      continue
    }

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
    const strokePages = await getPaginatedData(session._links.strokes.href)

    console.log('Assigning stroke data to session')
    for (const strokePage of strokePages) {
      strokePage.items.map((stroke) => {
        if (!stroke.proBallMeasurement) return

        const filteredStroke = {
          id: stroke.id,
          proBallMeasurement: stroke.proBallMeasurement,
          club: stroke.club,
          bay: stroke.bayName,
          createdAt: stroke.createdAt
        }
        delete filteredStroke?.proBallMeasurement?.ballTrajectory
        delete filteredStroke?.proBallMeasurement?.ballVelocity
        return filteredSession.strokes = [...filteredSession.strokes, filteredStroke]
      })
    }

    filteredSession.totalStrokes = filteredSession.strokes.length

    console.log('Adding session to sessions array')
    if (filteredSession.totalStrokes > 0) {
      filteredSessions = [...filteredSessions, filteredSession]
    }
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