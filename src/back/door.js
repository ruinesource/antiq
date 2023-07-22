import g from '../g.js'
import { get } from './get.js'
import { put } from './put.js'

export function door(name, descFunc, api = {}, options) {
  g.desc[name] = descFunc

  // нужно сделать очередь методов и результатов, которая отправляется на фронт
  // оборачивать методы в eventId
  // при их выполнении записывать результат в массив
  // по завершении ивента отправлять этот массив на фронт

  const door = (g.door[name] = {
    name,
  })

  for (let k in api) {
    door[k] = event(door, api[k], k)
  }

  return door
}

function event(door, apiFn, apiName) {
  return async function event(...args) {
    const event = g.currentEvent

    function setActionsWithEventToDoor() {
      door.get = withSettedEvent(async (id) => {
        const result = await get(door.name, id)

        event.results.push(result)

        return result
      })
      door.put = withSettedEvent(async (diff) => {
        const result = await put(door.name, diff)

        event.results.push(result)

        return result
      })
    }

    function withSettedEvent(method) {
      return async (...args) => {
        g.currentEvent = event
        const result = await method(...args)

        queueMicrotask(setActionsWithEventToDoor)
        return result
      }
    }

    setActionsWithEventToDoor()

    let result
    try {
      result = await apiFn(...args)
    } catch (e) {
      console.log(e)
    }

    return result
  }
}
