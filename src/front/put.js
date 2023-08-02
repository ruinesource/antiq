import { sendEvent } from './ws.js'
import {
  normId,
  iterate,
  iteratePrimitivesOrEmpty,
  isPlainObject,
  set,
  getPath,
  copy,
  isDoor,
} from '../utils.js'
import g from '../g.js'

// сущности все мутируются из put и создаются только один раз
// но мутировать их самостоятельно бессмысленно
// к системе привязан сам метод put
// в массивах хранятся экземпляры
// а не айди

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

export function put(doorName, diff, opts) {
  const { currentEvent: event } = g
  ++event.count

  let id = diff.id || Math.random()
  const nId = normId(doorName, id)

  if (!g.updated_at[nId]) g.updated_at[nId] = { val: new Date(0), value: {} }
  if (!g.val[nId]) g.val[nId] = {}
  const value = g.value[nId] || (g.value[nId] = {})

  if (event.results[event.count]) {
    putFromResults(nId)

    rerenderBounded(doorName, nId)
    return value
  }

  // сохраняем diff во временное хранилище
  // ререндерим связанные get
  optimisticPut(doorName, { ...diff, id })
  rerenderBounded(doorName, nId)

  // отмена изменений на ошибке
  const wasNotSended = !g.listner[event.id]
  if (wasNotSended)
    sendEvent({
      event,
      onSuccess() {
        console.log(copy(g))
        putFromResults(nId)
      },
      // onError() { тоже applyPutUpdate, поэтому getData будет брать данные из updates }
      // нужно применять изменения сразу, сохраняя предыдущие значения
      // в случае ошибки даём возможность предыдущие значения вернуть
    })

  console.log(copy(g))

  return value
}

function rerenderBounded(doorName, nextValue) {}

function optimisticPut(doorName, diff) {
  const desc = g.desc[doorName]
  const nId = normId(doorName, diff.id)
  const updated_at = new Date()

  iteratePrimitivesOrEmpty(diff, (inst, path) => {
    const pathDesc = getPath(desc, path)

    if (isDoor(pathDesc))
      set(g.parents, [normId(pathDesc.name, inst), ...path], nId)

    set(g.value[nId], path, inst)
    set(g.updated_at[nId].value, path, updated_at)
  })
}

function putFromResults(prevNId) {
  const { doorName, results, count } = g.currentEvent
  const { desc } = g.door[doorName]
  const diff = results[count]
  const updated_at = g.updated_at[prevNId]

  updated_at.val = new Date(diff.updated_at)
  delete diff.updated_at

  iteratePrimitivesOrEmpty(diff, (x, path) => {
    set(g.val[prevNId], path, x)

    const upd_at = getPath(updated_at.value, path) || new Date(0)
    if (upd_at < updated_at.val) set(g.value[prevNId], path, x)

    // при различии prev и normId перенести всё из одного в другое
    const pathDesc = getPath(desc, path)
    if (isDoor(pathDesc))
      set(g.parents, [prevNId, ...path], normId(pathDesc.name, x))

    set(updated_at.value, path, updated_at.val)
  })
}

function clearPutUpdate(nId, diff) {}
