import g from '../g.js'
import { get } from './get.js'
import { put } from './put.js'

export function door(name, descFunc, api = {}, options) {
  g.desc[name] = descFunc

  const door = {
    name,
    get(id) {
      return get(name, id)
    },
    async put(diff) {
      const result = await put(name, diff)
      return result.diffs
    },
    rm(id) {},
  }
  g.door[name] = door

  for (let k in api) {
    door[k] = api[k]
  }

  return door
}
