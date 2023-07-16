export const openingPromiseResolver = {
  exec: () => {},
}

// normId нужен для массивов? да, потому что с сервера они приходят в нормализованном состоянии []
// в каком виде нужен граф?
const g = {
  orm: {}, // name: () => ...pathToChild[]
  desc: {}, // { name: desc },
  queries: {
    createTable: [],
  },
  door: {}, // name: door
  values: {}, // normId: item
  updates: {}, // normId: [diff, diff...]
  listner: {},
  loaders: {}, // eventId | methodId: bool
  openingPromise: new Promise((r) => {
    openingPromiseResolver.exec = r
  }),
  opened: false,
  methods: {},
  currentEvent: {
    id: null,
    doorName: '',
    method: '',
    args: [],
  },
  currentEventId: null,
}

export default g
