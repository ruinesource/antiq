import g from '../g.js'
import { get } from './get.js'
import { put } from './put.js'

export function door(name, descFunc, api = {}, options) {
  // g.desc[name] = descFunc

  const door = {
    name,
  }

  g.door[name] = door
  g.v[name] = {}
  g.desc[name] = descFunc

  for (let k in api) {
    const apiK = api[k]
    door[k] = async function api(a) {
      if (!g.opened) await g.openingPromise

      door.get = (id) => get(name, id)
      door.put = (diff) => put(name, diff)

      const result = await apiK({ a })

      delete door.get
      delete door.put

      return result
    }
  }

  return door
}
