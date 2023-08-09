import g from '../g.js'
import { get } from './get.js'
import { put } from './put.js'
import { guests, guestsByNormId } from './ws.js'
import { set, normId } from '../utils.js'

export function door(name, descFunc, getters = {}, setters = {}, options) {
  g.desc[name] = descFunc

  const door = (g.door[name] = {
    name,
  })

  for (let k in getters) {
    door[k] = event(door, getters[k], k)
  }

  for (let k in setters) {
    door[k] = event(door, setters[k], k)
  }

  return door
}

function event(door, apiFn, apiName) {
  return async function event(...args) {
    const event = g.currentEvent

    function setActionsWithEventToDoor() {
      door.get = withSettedEvent(async (id) => {
        const result = await get(door.name, id)
        const nId = normId(door.name, id)

        set(guestsByNormId, [nId, event.guest], true)

        event.results.push(result)

        return result
      })

      door.put = withSettedEvent(async (diff) => {
        const result = await put(door.name, diff)
        const nId = normId(door.name, diff.id)

        for (let gst in guestsByNormId[nId]) {
          if (+gst !== event.guest) {
            guests[gst].send(
              JSON.stringify({
                action: 'put',
                diff: result,
                doorName: door.name,
              })
            )
          }
        }

        event.results.push(result)

        return result
      })
    }

    function withSettedEvent(apiFn) {
      return async (...args) => {
        g.currentEvent = event
        const result = await apiFn(...args)

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
      throw e
    }

    return result
  }
}
