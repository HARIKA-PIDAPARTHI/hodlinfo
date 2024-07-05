const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const databasePath = path.join(__dirname, 'ticker.db')

const app = express()

app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

let database = null

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    await database.run(`
      CREATE TABLE IF NOT EXISTS ticker (
        name TEXT,
        last REAL,
        buy REAL,
        sell REAL,
        high REAL,
        open REAL,
        volume REAL,
        base_unit TEXT
      )
    `)
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

const getextra = each => {
  return {
    last: each.last,
    buy: each.buy,
    sell: each.sell,
    difference: (((each.high - each.last) / each.high) * 100).toFixed(2),
    savings: (each.high - each.last).toFixed(0),
    bestprice: ((each.buy + each.sell) / 2).toFixed(0),
    day1: (((each.last - each.open) / each.open) * 100).toFixed(2),
  }
}

app.get('/api/tickers', async (req, res) => {
  let {base_unit} = req.query
  base_unit = base_unit.toUpperCase()
  try {
    const query = `SELECT * FROM ticker WHERE name = "${base_unit}";`
    const tickers = await database.all(query)
    res.json(tickers.map(each => getextra(each)))
  } catch (error) {
    res.status(500).send('Error retrieving tickers')
  }
})
