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
    const currentEvent = JSON.parse(message)
    const { eventId, doorName, method, args } = currentEvent

    // здесь нужно получить:
    // 1. результаты всех get внутри
    // 2. id всех сущностей из put

    g.currentEvent = currentEvent
    const values = await g.door[doorName][method](...args)

    ws.send(JSON.stringify(values))

    // switch (t) {
    //   case 'get': {
    //     const v = await g.door[name].get(id)
    //     ws.send(JSON.stringify({ i, v }))
    //     break
    //   }
    //   default:
    //     return null
    // }
  })
}
