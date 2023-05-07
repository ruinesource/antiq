import g from '../g.js'
import { get } from './get.js'
import { put } from './put.js'
// import { app } from './open.js'

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

  // отправлять данные в формате { door: { id: {...} } }
  // for (let key in api) {
  //   app.post(`/${name}-${key}`, async (req, res) => {
  //     const result = await api[key]({ d: req.body }, res)
  //     res.send(result)
  //   })
  // }

  return door
}
