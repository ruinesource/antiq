import g, { e } from '../g.js'
export const ws = new WebSocket('ws://localhost:5588')

let sessionId

// структура запроса
// структура ответа

export function open() {
  for (let key in g.desc) {
    g.desc[key] = g.desc[key]()
  }

  ws.onopen = () => {
    g.opened = true
    e.openingPromiseResolver()
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
