import { db } from './db.js'
import g from '../g.js'
import { isDoor, isPlainObject } from '../utils.js'

export async function get(name, id, res = {}) {
  await getItem(name, id, res)
  return res
}

async function getItem(name, id, res, door, desc) {
  let pk = 'id'
  if (!door) door = name
  else pk = door
  const sql = await db()
  const instQ = await sql(`select * from "${name}" where "${pk}" = ${id};`)
  const inst = instQ.rows[0]
  if (!inst) return null

  if (!desc) desc = g.desc[name]

  for (let key in desc) {
    if (isDoor(desc[key])) {
      const childName = desc[key].name
      await getItem(childName, inst[key], res)
    } else if (isPlainObject(desc[key])) {
      inst[key] = await getItem(`${name}_${key}`, id, res, door, desc[key])
    }
  }
  if (name === door) {
    if (!res[name]) res[name] = {}
    res[name][id] = inst
  }
  return inst
}
