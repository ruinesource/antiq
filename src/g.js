export const e = {
  openingPromiseResolver: () => {},
}

const g = {
  orm: {}, // name: () => ...pathToChild[]
  desc: {}, // { name: desc },
  queries: {
    createTable: [],
  },
  door: {}, // name: door
  v: {}, // normId: item
  listner: {},
  openingPromise: new Promise((r) => {
    e.openingPromiseResolver = r
  }),
  opened: false,
}

export default g
