import g, { openingPromiseResolver } from '../g.js'
export const ws = new WebSocket('ws://localhost:5588')

let sessionId

// структура запроса
// {
//   t: 'get',
//   a: [name, id],
//   i: eventId,
// }

// структура ответа

export function openWs() {
  for (let key in g.desc) {
    g.desc[key] = g.desc[key]()
  }

  ws.onopen = () => {
    g.opened = true
    openingPromiseResolver.exec()
  }

  ws.onmessage = async (msg) => {
    const data = JSON.parse(msg.data)

    if (data.t === 'open') {
      sessionId = data.sessionId
      return
    }

    if (g.listner[data.i]) {
      await g.listner[data.i](data)
      delete g.listner[data.i]
    }
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

  g.listner[event.i] = async (data) => {
    if (data.e) {
      reject(data.e)
    } else {
      const result = await onSuccess(data)
      g.currentEventId = event.i
      resolve(result)
    }
    delete g.listner[event.i]
  }

  return promise
}
