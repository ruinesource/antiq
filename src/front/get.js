import { sendEvent } from './ws.js'
import g from '../g.js'
import { isPlainObject, isDoor, normId } from '../utils.js'

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
  if (g.values[nId]) {
    if (!event.results[event.count]) event.results.push(g.values[nId])

    return g.values[nId]
  }

  // results для автоматического сета на фронт
  // results посчитанное на фронте и не требующее отправки на сервер

  if (event.results[event.count]) return actionResultToStore()

  return sendEvent({
    event,
    onSuccess: actionResultToStore,
  })
}

// граф нужен для удаления элементов
// и знать что ререндерить, какие методы пересчитывать при изменениях
// (сущность - метод в котором заюзана)
function actionResultToStore() {
  const { doorName, results, count } = g.currentEvent

  const item = results[count]

  return (g.values[normId(doorName, item.id)] = item)
}
