import { door, orm } from './antiq'

const a = orm('a', () => ({ b }))

const b = orm('b', () => ({ a }))

const c = door(a)

c.put(1, {
  b: { id: 2, name: 'ok' },
  e: 'e',
})

function App() {
  return 'hello'
}

export default App
