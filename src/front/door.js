import g from '../g.js'
import { get } from './get.js'
import { put } from './put.js'

export function door(name, descFunc, api = {}, options) {
  const door = {
    name,
  }

  g.door[name] = door
  g.v[name] = {}
  g.desc[name] = descFunc

  for (let k in api) {
    const apiFn = api[k]
    door[k] = async function api(a) {
      if (!g.opened) await g.openingPromise

      // get(id) === getOne
      // get({ ...equalityFilters }, { sort: ['name.asc'], pag: [from, to] }) === get[]
      // get(ast) -> get[]

      door.get = (id) => get(name, id)
      door.put = (diff) => put(name, diff)

      const result = await apiFn({ a })

      delete door.get
      delete door.put

      return result
    }
  }

  return door
}
