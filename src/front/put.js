import { sendEvent } from './ws.js'
import { normId, iterate, isPlainObject, set } from '../utils.js'
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
// но мутировать их самостоятельно бессмысленно
// к системе привязан сам метод put
// и в массивах хранятся в своими экземплярами
// а не айди

export async function put(doorName, diff, opts) {
  const { currentEvent: event } = g
  ++event.count

  let id = diff.id || Math.random()
  const hasNoId = !diff.id
  const date = Date.now()

  const nId = normId(doorName, id)
  const value = g.values[nId] || (g.values[nId] = {})
  const val = g.vals[nId] || (g.vals[nId] = {})
  const updated_at =
    g.updated_at[nId] || (g.updated_at[nId] = { value: '', values: {} })

  if (event.results[event.count]) {
    const itemFromServer = event.results[event.count]
    iterate(itemFromServer, (inst, path) => {
      // ключи "" и массивов?
      if (!isPlainObject(inst)) {
        set(value, path, inst)
        updated_at.values[path.join('.')] = date
      }
    })
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
        val()
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

// корневая сущность и отображаемая
// у корневой есть дата последнего изменения на сервере, она всегда приходит и записывается для всех полей
// если дата пришла позже записанной для сущности, то ничего не меняем
// get изменяет корневую всегда, если дата поля в корневой сущности раньше updated_at из get
// изменение put корневую сущность не меняет
// подтверждение put изменяет корневую всегда, если дата поля в корневой сущности раньше updated_at с сервера
// если дата пришла позже записанной для сущности, то ничего в корневой не меняем

// у полей отображаемой сущности тоже свой updated_at
// подтверждение put меняет значение updated_at полей отображаемой сущности, если оно позже
// если на put пришла ошибка и updated_at поля отображаемой сущности позже той, что при совершении put, то его откат поле не меняет
// если updated_at позже, откат подставляет поле из корневой сущности
// get меняет все поля отображаемой сущности, у которых updated_at раньше того что пришел в get

// сущности формы - это свои отдельные сущности, которые могут быть подключены к обновлению полей дверей

// кроме того, есть сущности методов результата вызовов только get
// при всех изменениях сущностей внутри них
// их результаты вызовов поскольку запомнены, мы запоминаем и ререндерим их на фронте

// на put и get мы создаём поключение к каждому связанному полю сущности
// при изменении полей всегда приходит дата запоминания в дб

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
