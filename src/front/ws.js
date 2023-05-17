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

  ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data)

    if (data.t === 'open') {
      sessionId = data.sessionId
      return
    }

    if (g.listner[data.i]) {
      g.listner[data.i](data)
    }
  }

  const doors = {}
  for (let k in g.door) {
    doors[`${k}D`] = g.door[k]
  }

  return doors
}
