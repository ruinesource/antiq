export const openingPromiseResolver = {
  exec: () => {},
}

// nId нужен для массивов? да, потому что с сервера они приходят в нормализованном состоянии []
// в каком виде нужен граф?
const g = {
  orm: {}, // name: () => ...pathToChild
  desc: {}, // { name: desc },
  door: {}, // name: door
  currentEvent: {
    id: null,
    doorName: '',
    apiName: '',
    args: [],
    results: [],
    count: -1,
    date: null,
  },

  // front
  opened: false,
  openingPromise: new Promise((r) => {
    openingPromiseResolver.exec = r
  }),
  value: {}, // nId: item
  val: {}, // nId: lastConfirmedItem
  updated_at: {}, // nId: { val: date, value: { field: date } },

  // при удалении идём по родителям и ставим null
  // массивы фильтруем
  parents: {}, // nId: parentNId: { ...pathToChild: true }
  childs: {}, // nId: childId: { ...pathToChild: true }

  // при обновлении обновляем все геттеры, экшны в которых вернули сущность
  // nIdEvents: {}, // nId: door: getApiName: eventArgsKey: [...actionResultIdx]

  // при удалении удаляем в массивах
  // при изменении идём по get-массивам и проверяем, выполняется ли условие query
  // nIdActions: {}, // nId: { door: { getActionArgs: { ...pathsToInst } } }

  listner: {}, // eventId: onSuccess
  promise: {}, // door: getterName: argsKey: promise/result

  // back
  queries: {
    createTable: [],
  },
  listners: {}, // guest: normId: ?fileds
  isWsEvent: false,
  currentWsEvent: null,
  events: {}, // eventId-event
  eventChilds: {}, // eventId-childEventId
}

export default g
