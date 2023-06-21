import React from 'react'
import ReactDOM from 'react-dom/client'
import hotel from './hotel.js'
import { openWs } from './front/ws.js'
import { door } from './front/door.js'
import g from './g.js'

function App() {
  useD(bookD.one, 17)
  useA(bookD.one)

  return <div className="App"></div>
}

const { bookD } = hotel({ door, onOpen: openWs })

// если мы вызываем извне реакта
// в useD с теми же аргументами должны оказываться сущности без отправки запроса
// а useA должен отправлять запрос

// методы с put/rm невозможно использовать в useD, ошибка
// методы с put/rm можно вызвать без useA, door.method()
// при этом подключение к сущностям не происходит
// но если задействованы новые поля, к ним подключаем

// сохраняем сущности из всех get-методов
// при изменении пересчитываем

// запускаем метод
// на первом get останавливаемся, делаем запрос
// на сервере выполняем метод полностью
// отправляем на фронт массив с результатами всех экшнов
// если не встретилось put/rm, добавляем к sessionId поля всех сущностей из get

// что делать с полями

bookD.one(17) //.then((res) => console.log(res, g))

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
