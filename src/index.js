import React from 'react'
import ReactDOM from 'react-dom/client'
import hotel from './hotel.js'
import { open } from './front/ws.js'
import { door } from './front/door.js'

function App() {
  return <div className="App"></div>
}

const { bookD } = hotel({ door, open })

bookD.one(17).then((res) => console.log(res))

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
