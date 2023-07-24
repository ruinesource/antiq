import { sendEvent } from './ws.js'
import { normId } from '../utils.js'
import g from '../g.js'

// строим граф
// подписываемся на изменение сущностей

// рекурсий нет
// !(сделать и удалить) может придти id

// отношения родитель-потомок по normId

// сохраняем значение до put
// удаляем его на success бэка
// подставляем при ошибке после revert ивента

// каждый ивент создаёт симулированный мир изменений
// изменения, которые он несёт + предыдущее до него состояние (для отладки, отмены и пр)
// предыдущее состояние может быть из симулированного мира другого ивента

// эти изменения пополняются в начале ивента
// и заполняются до конца и применяются на ответ сервера
// есть очередь ивентов, у них есть загрузка
// ивент имеет полную информацию в момент ответа от сервера
// очередь ивентов очищается

// на put мы смотрим связанные сущности
// в симулированном мире, к которому подключены хуки, их изменяем

// первым делом, проверяем есть ли у сущности id
// если нет, то создаём

// computed массив по флагу(условию)
// сервер смотрит, нужно ли уведомлять
// фронт смотрит, может ли показать изменения без отправки на сервер

// .get() -> merge(value, updates)

// addedRelations, removedRelations

// сущности все мутируются из put и создаются только один раз
// но мутировать их вручную бессмысленно
// к системе привязан сам метод put
// и в массивах хранятся в своими экземплярами
// а не айди

export async function put(doorName, diff, opts) {
  const { currentEvent: event } = g
  ++event.count

  let id = diff.id || Math.random()
  const hasNoId = !diff.id

  const nId = normId(doorName, id)
  const value = g.values[nId] || {}
  let updateIdx

  if (event.results[event.count]) {
    const itemFromServer = event.results[event.count]
    for (let k of itemFromServer) {
      value[k] = itemFromServer[k]
    }
    rerenderBounded(doorName, nId)
    return value
  } else {
    // сохраняем diff во временное хранилище
    // ререндерим связанные get

    addPutUpdate(nId, diff)
    rerenderBounded(doorName, nId)
  }

  // отмена изменений на ошибке
  const result = await sendEvent({
    event,
    onSuccess() {
      const itemFromServer = event.results[event.count]

      if (hasNoId) {
        // changeId everywhere
      }
      g.updates[nId].splice(g.updates[nId].indexOf(diff), 1)

      for (let k of itemFromServer) {
        value[k] = itemFromServer[k]
      }
    },
    // onError() { тоже applyPutUpdate, поэтому getData будет брать данные из updates }
    // нужно применять изменения сразу, сохраняя предыдущие значения
    // в случае ошибки даём возможность предыдущие значения вернуть
    //
  })

  return result
}

function rerenderBounded(doorName, nextValue) {}

function addPutUpdate(nId, diff) {
  const { currentEvent: event } = g

  const prevValues = {}
  const value = g.values[nId]

  for (let key in diff) {
    prevValues[key] = value[key]
    value[key] = diff[key]
    // ...
  }

  const idx = event.prevValues.length
  event.prevValues.push(diff)

  if (g.prevValues[nId]) {
    g.prevValues[nId].push([event.id, idx])
  } else {
    g.prevValues[nId] = [[event.id, idx]]
  }

  return idx
}

function applyPutUpdate(nId, idx) {
  const { currentEvent: event } = g
}

function clearPutUpdate(nId, diff) {}
