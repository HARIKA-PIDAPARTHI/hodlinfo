const axios = require('axios')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const databasePath = path.join(__dirname, 'ticker.db')

const fetchAndStoreTickers = async () => {
  const database = await open({
    filename: databasePath,
    driver: sqlite3.Database,
  })

  const response = await axios.get('https://api.wazirx.com/api/v2/tickers')
  const tickers = Object.values(response.data)

  await database.run('DELETE FROM ticker')

  for (const ticker of tickers) {
    const {last, buy, sell, volume, base_unit, high, open} = ticker
    const name = ticker.name.split('/')[0]

    await database.run(
      `INSERT INTO ticker (name, last, buy, sell, high, open, volume, base_unit) VALUES ('${name}', ${last},${buy}, ${sell}, ${high},${open}, ${volume}, '${base_unit}')`,
    )
  }
}

fetchAndStoreTickers()
