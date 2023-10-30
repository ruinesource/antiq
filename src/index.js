import React from 'react'
import ReactDOM from 'react-dom/client'
import hotel from './hotel.js'
import { open } from './front/ws.js'
import { copy } from './utils.js'
import g from './g.js'

function App() {
  // useD(bookD.one, 17)
  // useA(bookD.one)

  return <div className="App"></div>
}

const { bookD } = open(hotel)

// если мы вызываем извне реакта
// в useDa с теми же аргументами должны оказываться сущности без отправки запроса
// а useAc должен отправлять запрос

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

// g.promises.book.x[argsKey] = promise->getterResult

// bookD.x().then(() => console.log(3, copy(g)))
// bookD.x().then(() => console.log(3, copy(g)))
// bookD.y().then((res) => console.log(res))
// console.log(1, copy(g))

bookD.upd({ id: 17, deep: { ea: 'oki' } }).then((res) => {
  console.log('after put', res, g)
})
window.g = g
window.k = () => {
  bookD.upd({ id: 17, deep: { ea: 'very' } })
  bookD.one(17).then(console.log)
}

// console.log(2, copy(g))
// bookD.one(17).then((e) => {
//   console.log('one', e)
// })

// window.p = () => {
//   bookD.upd({ team_member: 8 })
// }

// upd пока не пришел ответ от предыдущего
// загрузка
// очередь промисов
// два выполнения метода
// отмена ошибки
// первый запрос успешно, второй ошибка
// во время выполнения, после выполнения
// отмена при ошибке в window
// ререндер использующих метод хуков
// пересчёт использующих сущность get-методов

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
