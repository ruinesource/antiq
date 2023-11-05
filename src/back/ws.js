import ws from 'ws'
import http from 'http'
import g from '../g.js'

const wss = new ws.Server({ noServer: true })

export const guests = {}
export const guestsByNormId = {}

// door -> session
// при изменении door оповещаем все связанные сессии

http
  .createServer((req, res) => {
    wss.handleUpgrade(req, req.socket, Buffer.alloc(0), onSocketConnect)
  })
  .listen(5588)

function onSocketConnect(ws) {
  const guest = Math.random()

  guests[guest] = ws

  ws.send(
    JSON.stringify({
      t: 'open',
      guest,
    })
  )

  ws.on('message', async function (message) {
    const event = JSON.parse(message)
    const { doorName, apiName, args } = event
    event.results = []

    // здесь в results записываем по порядку:
    // результаты get
    // изменения put
    // удалённые элементы
    // результаты back

    g.currentEvent = event
    g.isWsEvent = true
    g.events[event.id] = event
    g.eventChilds[event.id] = {}

    try {
      await g.door[doorName][apiName](...args)
      ws.send(
        JSON.stringify({
          id: event.id,
          results: event.results,
        })
      )
    } catch (e) {
      console.log(e)
      ws.send(JSON.stringify({ id: event.id, e }))
    }
    // removeEventWithChilds(event.id)
  })

  ws.on('close', (...args) => console.log('close', args))
}

function removeEventWithChilds(id) {
  const childs = g.eventChilds[id]
  for (let cId of childs) removeEventWithChilds(cId)
  delete g.events[id]
  delete g.eventChilds[id]
}
