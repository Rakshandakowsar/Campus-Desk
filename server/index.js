import cors from 'cors'
import express from 'express'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataFile = join(__dirname, '..', 'data', 'requests.json')
const studentsFile = join(__dirname, '..', 'data', 'students.json')
const app = express()
const port = process.env.PORT || 8787

app.use(cors())
app.use(express.json({ limit: '100kb' }))

function readRequests() {
  return JSON.parse(readFileSync(dataFile, 'utf8'))
}

function writeRequests(requests) {
  writeFileSync(dataFile, `${JSON.stringify(requests, null, 2)}\n`)
}

function readStudents() {
  return JSON.parse(readFileSync(studentsFile, 'utf8'))
}

function writeStudents(students) {
  writeFileSync(studentsFile, `${JSON.stringify(students, null, 2)}\n`)
}

function routeRequest(message) {
  const text = message.toLowerCase()
  if (/(fee|payment|refund|receipt|scholarship|finance)/.test(text)) return { category: 'Fees & finance', department: 'Finance Office' }
  if (/(hostel|room|mess|maintenance|facility|transport)/.test(text)) return { category: 'Hostel & facilities', department: 'Campus Facilities' }
  if (/(certificate|bonafide|transcript|document)/.test(text)) return { category: 'Certificates', department: 'Academic Services' }
  if (/(placement|internship|job|resume|career)/.test(text)) return { category: 'Placements', department: 'Career Cell' }
  return { category: 'Academics', department: 'Academic Services' }
}

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, service: 'campusdesk-api', timestamp: new Date().toISOString() })
})

app.post('/api/students/register', (request, response) => {
  const name = typeof request.body.name === 'string' ? request.body.name.trim() : ''
  const rollNumber = typeof request.body.rollNumber === 'string' ? request.body.rollNumber.trim().toUpperCase() : ''
  if (name.length < 2 || !/^[A-Z0-9-]{4,20}$/.test(rollNumber)) {
    return response.status(400).json({ error: 'Enter a valid name and roll number.' })
  }

  const students = readStudents()
  const student = { name, rollNumber, registeredAt: new Date().toISOString() }
  const existingIndex = students.findIndex((item) => item.rollNumber === rollNumber)
  if (existingIndex >= 0) students[existingIndex] = student
  else students.push(student)
  writeStudents(students)
  response.status(201).json({ student })
})

app.get('/api/requests', (request, response) => {
  const studentId = request.query.studentId || '23CS1042'
  const requests = readRequests().filter((item) => item.studentId === studentId)
  response.json({ requests })
})

app.post('/api/requests', (request, response) => {
  const message = typeof request.body.message === 'string' ? request.body.message.trim() : ''
  const studentId = typeof request.body.studentId === 'string' ? request.body.studentId : '23CS1042'
  if (!message) return response.status(400).json({ error: 'A request message is required.' })

  const requests = readRequests()
  const routing = routeRequest(message)
  const nextNumber = Math.max(0, ...requests.map((item) => Number(item.id.replace('CD-', '')) || 0)) + 1
  const created = {
    id: `CD-${nextNumber}`,
    studentId,
    title: message,
    message,
    category: routing.category,
    department: routing.department,
    status: 'In review',
    tone: 'review',
    createdAt: new Date().toISOString(),
  }
  requests.unshift(created)
  writeRequests(requests)
  response.status(201).json({ request: created, answer: `I routed this to ${routing.department}. You can track it in My requests.` })
})

app.get('/api/analytics/pulse', (_request, response) => {
  const requests = readRequests()
  const resolved = requests.filter((item) => item.status === 'Resolved').length
  const total = requests.length || 1
  response.json({ resolved, total, firstResponseRate: Math.round((resolved / total) * 100), trend: 12.4 })
})

app.listen(port, () => {
  console.log(`Campusdesk API listening on http://localhost:${port}`)
})
