import { sendEvent } from './ws.js'
import {
  normId,
  iteratePrimitivesOrEmpty,
  set,
  getPath,
  isDoor,
  copy,
} from '../utils.js'
import { addRelation, removeRelation } from './relations.js'
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
// при изменении полей всегда приходит дата запоминания в бд

// !!!!!!!!! при изменении child_db в door нужно менять updated_at у бд самой door !!!!!!!!!

// копить обновления до получения id

export function put(doorName, diff, opts) {
  ++g.currentEvent.count
  const { id: eventId, count, results } = g.currentEvent

  if (results[count]) {
    const nId = putFromResults(doorName, count)

    rerenderBounded(doorName, nId)
    return g.value[nId]
  }

  let id = diff.id || Math.random() // Symbol()?
  const nId = normId(doorName, id)

  if (!g.updated_at[nId]) g.updated_at[nId] = { val: new Date(0), value: {} }
  const value = g.value[nId] || (g.value[nId] = {})

  // сохраняем diff во временное хранилище
  // ререндерим связанные get
  optimisticPut(doorName, nId, diff)
  rerenderBounded(doorName, nId)

  const wasNotSended = !g.listner[eventId]

  if (wasNotSended)
    sendEvent({
      event: g.currentEvent,
      onSuccess() {
        // !!!! здесь добавить подстановку id пришедшего с сервера !!!!
        // следующий этап
        //
        // put по идее совсем ничего не меняет
        // он только добавляет id на создание сущности
        // перемены интерфейса не нужны
        // только loading состояние
        // и изменения на receive
        // сам id мы и так получаем свежий во всех функциях
        // ...или нет, если деструктурировали в теле компонента
        // putFromResults(doorName, count, nId)
        // if (!diff.id) removeMock(doorName, nId)
      },
      // onError() { тоже applyPutUpdate, поэтому getData будет брать данные из updates }
      // нужно применять изменения сразу, сохраняя предыдущие значения
      // в случае ошибки даём возможность предыдущие значения вернуть
    })

  return value
}

function rerenderBounded(doorName, nextValue) {}

function optimisticPut(doorName, nId, diff) {
  const desc = g.desc[doorName]
  const now = new Date()

  iteratePrimitivesOrEmpty(diff, (x, path) => {
    const childDesc = getPath(desc, path)

    if (isDoor(childDesc)) {
      addRelation(nId, path, normId(childDesc.name, x))
    }

    set(g.value[nId], path, x)
    set(g.updated_at[nId].value, path, now)
  })
}

export function putFromResults(doorName, actionCount, prevNId) {
  const diff = g.currentEvent.results[actionCount]
  const nId = normId(doorName, diff.id)
  const desc = g.desc[doorName]

  if (!g.updated_at[nId]) g.updated_at[nId] = { val: new Date(0), value: {} }
  if (!g.val[nId]) g.val[nId] = g.val[prevNId] ? g.val[prevNId] : {}
  if (!g.value[nId]) g.value[nId] = g.value[prevNId] ? g.value[prevNId] : {}
  const updated_at = g.updated_at[nId]
  const diffUpd = new Date(diff.updated_at)

  if (diffUpd > updated_at.val) updated_at.val = diffUpd
  delete diff.updated_at

  iteratePrimitivesOrEmpty(diff, (x, path) => {
    const upd_at = getPath(updated_at.value, path) || 0
    if (diffUpd >= upd_at) {
      set(g.val[nId], path, x)
      set(g.value[nId], path, x)
      set(updated_at.value, path, diffUpd)

      const childDesc = getPath(desc, path)
      if (isDoor(childDesc)) addRelation(nId, path, normId(childDesc.name, x))
    }
  })

  return nId
}

function cancelOptimisticPut(doorName, id) {
  const desc = g.desc[doorName]
  const nId = normId(doorName, id)
  const value = g.value[nId]
  const val = g.val[nId]
  const updated_at = g.updated_at[nId]

  if (!val) delete g.value[nId]
  else
    iteratePrimitivesOrEmpty(val, (inst, path) => {
      set(value, path, inst)
      set(updated_at.value, path, updated_at.val)

      const childDesc = getPath(desc, path)
      if (isDoor(childDesc)) removeRelation(nId, normId(childDesc.name, inst))
    })
}

function removeMock(doorName, mockNId) {
  delete g.val[mockNId]
  delete g.value[mockNId]
  delete g.updated_at[mockNId]
  delete g.parents[mockNId]
  delete g.childs[mockNId]
  deleteSecondLevel('parents')
  deleteSecondLevel('childs')

  function deleteSecondLevel(k) {
    for (const nId in g[k]) delete g[k][nId][mockNId]
  }
}
