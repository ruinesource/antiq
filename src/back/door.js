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
    door[k] = action(door, getters[k], k)
  }

  for (let k in setters) {
    door[k] = action(door, setters[k], k)
  }

  return door
}

function action(door, apiFn, apiName) {
  return async function action(...args) {
    // в конце в g.currentAction устанавливаем либо родительский
    // либо, если родителя нет, то null

    const { isWsAction } = g
    if (isWsAction) g.isWsAction = false

    let action = isWsAction
      ? g.currentAction
      : {
          id: Math.random(),
          doorName: door.name,
          results: [],
          guest: g.currentAction.guest,
          count: -1,
          args,
          apiName,
        }
    if (!isWsAction) action.parent = g.currentAction

    setMethodsToDoor(action)

    let result
    try {
      result = await apiFn(...args)
    } catch (e) {
      console.error(e)
      throw e
    }

    if (action.parent) {
      action.parent.results.push(action)
      delete action.parent
      g.currentAction = action.parent
    }

    return result
  }

  function setMethodsToDoor(action) {
    door.get = withAction(action, async (id) => {
      g.currentAction = action
      const result = await get(door.name, id)
      const nId = normId(door.name, id)

      set(guestsByNormId, [nId, action.guest], true)
      setMethodsToDoor(action)

      return result
    })

    door.put = withAction(action, async (diff) => {
      g.currentAction = action
      const result = await put(door.name, diff)

      setMethodsToDoor(action)

      const nId = normId(door.name, diff.id)
      for (let gst in guestsByNormId[nId]) {
        if (+gst !== action.guest) {
          guests[gst].send(
            JSON.stringify({
              method: 'put',
              diff: result,
              doorName: door.name,
            })
          )
        }
      }

      return result
    })
  }

  function withAction(action, apiFn) {
    return async (...args) => {
      g.currentAction = action

      const result = await apiFn(...args)
      action.results.push(result)

      console.log(action)
      g.currentAction = action
      return result
    }
  }
}
