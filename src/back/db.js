import pg from 'pg'

pg.types.setTypeParser(1114, (x) => x)

let client = null

export async function db() {
  if (!client) {
    const { Client } = pg
    client = new Client({
      database: 'test',
    })
    await client.connect()
  }

  return client.query.bind(client)
}
