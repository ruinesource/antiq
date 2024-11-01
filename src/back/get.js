import { db } from './db.js'
import g from '../g.js'
import { delay, isDoor, isPlainObject } from '../utils.js'

// на get на сервере мы создаём подписку на все полученные поля сущности
// и пользуемся ими в оповещениях после put
// и можем отправить по вебсокетам на фронт результат гета (для пересчёта значений без запроса)
// если фронт уже подписан на все нужные поля сущности, ничего не отправляем

// на сервере экшн может запуститься посередине выполнения экшна фронтом

// выполняем тело экшна и на фронте и на сервере полностью
// уведомляем фронт об ошибке и отменяем результаты в случае ошибки сервера, предлагаем повторить запрос
// в случае ошибки фронта ничего не отменяем
// но если сервер дошел до конца метода и без информации от него
// изменения сохраняются

// серверу фронт ждать никогда не надо, вся инфа с фронта поступает в аргументы
// если нужно несколько действий на сервере, фронт их ожидает

let count = 0

export async function get(name, id) {
  const result = await getItem(name, id)

  if (count < 2 && id == 1) {
    count = 0
    await delay(4000)
  } else {
    await delay(300)
    count++
  }
  // if (!id) throw 'no such item'

  return result
}

async function getItem(name, id, door, desc) {
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
      await getItem(childName, inst[key])
    } else if (isPlainObject(desc[key])) {
      inst[key] = await getItem(`${name}_${key}`, id, door, desc[key])
      if (pk === door) {
        delete inst[pk]
        delete inst.created_at
        delete inst.updated_at
      }
    }
  }
  return inst
}
