import hotel from './src/hotel.js'
import { door } from './src/back/door.js'
import './src/back/ws.js'
import g from './src/g.js'

hotel({
  door,
  open: () => {
    for (let k in g.desc) {
      g.desc[k] = g.desc[k]()
    }
  },
})
