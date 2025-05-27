import pg from 'pg'

// ???
// pg.types.setTypeParser(1114, (x) => x)

let client = null

export async function db() {
  if (!client) {
    const { Client } = pg
    client = new Client({
      database: 'test',
    })
    try {
      await client.connect()
    } catch (e) {
      console.log(e)
    }
  }

  return client.query.bind(client)
}
