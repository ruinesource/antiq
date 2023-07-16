import React from 'react'
import ReactDOM from 'react-dom/client'
import hotel from './hotel.js'
import { openWs } from './front/ws.js'
import { door } from './front/door.js'
import g from './g.js'

function App() {
  // useD(bookD.one, 17)
  // useA(bookD.one)

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

// подключение определяется наличием полей сущности/get-аргументов в фронтовом сторе

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// запускаем метод
// на первом экшне делаем запрос
// на первом get останавливаемся, если результата нет
// на сервере выполняем метод полностью
// отправляем на фронт массив с результатами всех экшнов
// если не встретилось put/rm, добавляем к sessionId поля всех сущностей из get
// при изменении этих сущностей, отправляем на фронт [{ t: 'get', ... }, { ... }] и выполняем с ними метод
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

// метод возвращает promise
// экшн тоже всегда возвращает promise

// на put тоже делаем отслеживание

bookD.one(17) //.then((res) => console.log(res, g))

// bookD.upd({
//   name: 'oki',
//   team_member: null,
//   authors: [],
//   deep: {
//     ea: 'oki',
//     very: {
//       ea: 'doki',
//     },
//   },
// })

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
