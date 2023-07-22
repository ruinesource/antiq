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
    const event = JSON.parse(message)
    const { doorName, method, args } = event
    event.results = []

    // здесь в results записываем по порядку:
    // 1. результаты всех get
    // 2. все изменения put
    // 3. все удалённые элементы

    g.currentEvent = event

    await g.door[doorName][method](...args)

    ws.send(JSON.stringify(event))

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
