import g, { openingPromiseResolver } from '../g.js'
import { door } from './door.js'
const ws = new WebSocket('ws://localhost:5588')

let sessionId

// структура запроса
// {
//   t: 'get',
//   a: [name, id],
//   i: id,
// }

// структура ответа

export function open(hotel) {
  ws.onopen = () => {
    g.opened = true
    openingPromiseResolver.exec()
  }

  ws.onmessage = async (msg) => {
    const event = JSON.parse(msg.data)

    // if (event.t === 'open') {
    //   sessionId = event.sessionId
    //   return
    // }

    if (g.listner[event.id]) {
      await g.listner[event.id](event)
      delete g.listner[event.id]
    }
  }

  hotel(door)

  for (let key in g.desc) {
    g.desc[key] = g.desc[key]()
  }

  const doors = {}
  for (let k in g.door) {
    doors[`${k}D`] = g.door[k]
  }

  return doors
}

export function sendEvent({ event, onSuccess }) {
  ws.send(JSON.stringify(event))

  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })

  g.listner[event.id] = async (serverEvent) => {
    event.results = serverEvent.results
    g.currentEvent = event

    if (serverEvent.error) {
      reject(serverEvent.error)
    } else {
      const result = await onSuccess()

      resolve(result)
    }
    delete g.listner[event.id]
  }

  return promise
}
