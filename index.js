require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')
const app = express()

app.use(cors())
app.use(express.static('build'))
app.use(express.json())

morgan.token('reqBodyToString', (req, res) => {
  return JSON.stringify(req.body)
})
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :reqBodyToString'))

app.get('/info', (req, res, next) => {
  Person.find({}).then(persons => {
    const date = new Date()
    const display = `Phonebook has info for ${persons.length} people.`
    res.send(display + date.toString())
  })
  .catch(error => next(error))
})

app.get('/api/persons', (req, res, next) => {
  Person.find({}).then(persons => {
    res.json(persons)
  })
  .catch(error => next(error))
})

app.get('/api/persons/:id', (req, res, next) => {
  const id = req.params.id
  Person.findById(id).then(person => {
    if (person) {
      res.json(person)
    } else {
      res.status(404).end()
    }
  })
  .catch(error => next(error))
})

app.delete('/api/persons/:id', (req, res, next) => {
  const id = req.params.id
  Person.findByIdAndRemove(id).then(response => {
    res.status(204).end()
  })
  .catch(error => next(error))
})

app.post('/api/persons', (req, res, next) => {
  const body = req.body
  console.log(body)
  const newPerson = new Person({
    ...body,
  })
  if (newPerson.name.length === 0 || newPerson.number.length === 0) {
    return res.status(400).json({ 
      error: 'name or number is missing' 
    })
  } else {
    newPerson.save().then(savedPerson => {
      res.json(savedPerson)
    })
    .catch(error => next(error))
  }
})

const opts = { runValidators: true }

app.put('/api/persons/:id', (req, res, next) => {
  const body = req.body
  const id = req.params.id

  const updatedPerson = {
    name: body.name,
    number: body.number,
    id: id
  }

  Person.findByIdAndUpdate(id, updatedPerson, opts, { new: true })
    .then(updated => {
      res.json(updated)
    })
    .catch(error => next(error))
})

const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

const errorHandler = (error, req, res, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return res.status(400).send({ error: 'malformatted id' })
  } else if (error.name === "ValidationError") {
    return res.status(400).send({  error: error.message })
  }

  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`Server running on port ${3001}`)
})