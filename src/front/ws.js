import g, { openingPromiseResolver } from '../g.js'
import { filterObj, copy } from '../util.js'
import { door } from './door.js'
import { putFromResults, rerenderBounded } from './put.js'
const ws = new WebSocket('ws://localhost:4387')

let guest

// структура запроса
// {
//   t: 'get',
//   a: [name, id],
//   i: id,
// }

// структура ответа

let wsLogs = {}

export function open(hotel) {
  // guest при открытии
  // передаём с каждым ивентом
  // на сервере записываем все используемые guest-normId
  // на сеттеры смотрим, какие guest на них подписаны, отправляем их им

  ws.onmessage = async (msg) => {
    const action = JSON.parse(msg.data)

    if (action.t === 'open') {
      g.opened = true
      guest = action.guest
      openingPromiseResolver.exec()
      return
    }

    if (g.listner[action.id]) {
      await g.listner[action.id](action)
      delete g.listner[action.id]
    }

    if (action.t === 'put') {
      g.currentAction = { results: [action.diff] }
      putFromResults(action.doorName, 0)
      // ...rerenderBounded
    }
  }

  ws.onclose = () => ws.close('"hard close"')

  window.onbeforeunload = function () {
    ws.onclose = function () {} // disable onclose handler first
    ws.close('"hard close"')
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

export async function sendAction({ action, onSuccess }) {
  if (!guest) await openingPromiseResolver

  action.guest = guest

  const msg = filterObj(action, 'count', 'parent', 'results')

  if (wsLogs) wsLogs[action.id] = { front: msg }
  ws.send(JSON.stringify(msg))

  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })

  g.listner[action.id] = async (serverAction) => {
    action.results = serverAction.results
    g.currentAction = action

    if (wsLogs) {
      wsLogs[action.id].server = action
      console.log('ws', wsLogs[action.id])
      delete wsLogs[action.id]
    }

    if (serverAction.e) {
      reject(serverAction.e)
    } else {
      const result = await onSuccess()

      resolve(result)
    }
    delete g.listner[action.id]
  }

  return promise
}
