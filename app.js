const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const databasePath = path.join(__dirname, 'todoApplication.db')

const app = express()

app.use(express.json())

let database = null

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log('DB Error: ${error.message}')
    process.exit(1)
  }
}

initializeDbAndServer()

const convertDbObjectToResponseObject = dbObject => {
  return {
    todoId: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
  }
}

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

app.get('/todos/', async (request, response) => {
  let {priority, status, search_q = ''} = request.query
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
            SELECT
                *
            FROM
                todo 
            WHERE
                todo LIKE '%${search_q}%'
                AND status = '${status}'
                AND priority = '${priority}';`
      break
    case hasPriorityProperty(request.query):
      getTodosQuery = `
            SELECT
                *
            FROM
                todo 
            WHERE
                todo LIKE '%${search_q}%'
                AND priority = '${priority}';`
      break
    case hasStatusProperty(request.query):
      getTodosQuery = `
            SELECT
                *
            FROM
                todo 
            WHERE
                todo LIKE '%${search_q}%'
                AND status = '${status}';`
      break
    default:
      getTodosQuery = `
            SELECT
                *
            FROM
                todo 
            WHERE
                todo LIKE '%${search_q}%';`
  }
  let result = await database.all(getTodosQuery)
  response.send(result)
})

app.get('/todos/:todoId/', async (request, response) => {
  let {todoId} = request.params
  let query = `SELECT * FROM todo WHERE id=${todoId};`
  let result = await database.get(query)
  response.send(result)
})

app.post('/todos/', async (request, response) => {
  let {id, todo, priority, status} = request.body
  let query = `INSERT INTO todo(id,todo,priority,status) VALUES (${id},'${todo}','${priority}','${status}');`
  let result = await database.run(query)
  response.send('Todo Successfully Added')
})

const hasTodoProperty = requestQuery => {
  return requestQuery.todo !== undefined
}

app.put('/todos/:todoId/', async (request, response) => {
  let {todoId} = request.params
  let {todo, status, priority} = request.body
  let query
  switch (true) {
    case hasPriorityProperty(request.body):
      query = `UPDATE todo SET priority='${priority}' WHERE id=${todoId};`
      response.send('Priority Updated')
      break
    case hasStatusProperty(request.body):
      query = `UPDATE todo SET status='${status}' WHERE id=${todoId};`
      response.send('Status Updated')
      break
    case hasTodoProperty(request.body):
      query = `UPDATE todo SET todo='${todo}' WHERE id=${todoId};`
      response.send('Todo Updated')
      break
  }
  let result = await database.run(query)
})

app.delete('/todos/:todoId/', async (request, response) => {
  let {todoId} = request.params
  let query = `DELETE FROM todo WHERE id=${todoId};`
  let result = await database.run(query)
  response.send('Todo Deleted')
})
module.exports = app
