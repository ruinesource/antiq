import ws from 'ws'
import http from 'http'
import g from '../g.js'

const wss = new ws.Server({ noServer: true })

const clients = {}

// door -> session
// при изменении door оповещаем все связанные сессии

http
  .createServer((req, res) => {
    wss.handleUpgrade(req, req.socket, Buffer.alloc(0), onSocketConnect)
  })
  .listen(5588)

function onSocketConnect(ws) {
  const sessionId = Math.random()

  clients[sessionId] = ws

  ws.send(
    JSON.stringify({
      t: 'open',
      sessionId,
    })
  )

  ws.on('message', async function (message) {
    const { t, e, a, i } = JSON.parse(message)
    const [name, id] = a
    switch (t) {
      case 'get': {
        const v = await g.door[name].get(id)
        ws.send(JSON.stringify({ i, v }))
        break
      }
      default:
        return null
    }
  })
}
