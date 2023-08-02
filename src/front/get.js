import { sendEvent } from './ws.js'
import g from '../g.js'
import {
  getPath,
  set,
  argsKey,
  iteratePrimitivesOrEmpty,
  isPlainObject,
  isDoor,
  normId,
} from '../utils.js'

// i eventId
// d door
// e eventName
// a eventArgs
// err err
// c cookies...

// на одно свойство может потребоваться несколько сравнений (и/или)

// структура экшна
// { t: type, i: eventId, a: args }

// структура ответа
// {
//   v: { door: { id: deepValuesWithoutDoors } },
//   i: eventId
// }

// на сервере мы выполняем метод
// запускаем выполнение и чё
// смотрим, какие ивенты задействованы (может быть асинхронное)
// результаты записываем в eventId: [updates]

export async function get(name, id, opts) {
  const { currentEvent: event } = g
  ++event.count

  // здесь если сущность уже есть на фронте со всеми полями
  // возвращаем её даже без промиса, синхронным кодом
  // изменённые поля определяем на сервере
  // при рассчётах внутри апи могут потребоваться поля, не возвращающиеся в компоненты
  // такие поля влияют на ререндер
  // поэтому для оптимизации рендера используем omit и select апи, а не хуки

  const nId = normId(name, id)

  if (g.value[nId]) {
    if (!event.results[event.count]) event.results.push(g.value[nId])

    return g.value[nId]
  }

  // results для автоматического сета на фронт
  // results посчитанное на фронте и не требующее отправки на сервер

  if (event.results[event.count]) return getFromResults()

  return sendEvent({
    event,
    onSuccess: getFromResults,
  })
}

function getFromResults() {
  const { doorName, results, count } = g.currentEvent
  const { desc } = g.door[doorName]
  const item = results[count]
  const nId = normId(doorName, item.id)
  const updated_at = g.updated_at[nId]

  updated_at.val =
    new Date(item.updated_at) > updated_at.val
      ? new Date(item.updated_at)
      : updated_at.val
  delete item.updated_at

  iteratePrimitivesOrEmpty(item, (x, path) => {
    set(g.val[nId], path, x)

    const upd_at = getPath(updated_at.value, path) || new Date(0)
    if (upd_at < updated_at.val) set(g.value[nId], path, x)

    const pathDesc = getPath(desc, path)
    if (isDoor(pathDesc))
      set(g.parents, [nId, ...path], normId(pathDesc.name, x))

    set(updated_at.value, path, updated_at.val)
  })
}
