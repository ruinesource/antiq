import React from 'react'
import ReactDOM from 'react-dom/client'
import hotel from './hotel.js'
import { open } from './front/ws.js'
import g from './g.js'
import { useGet } from './front/hooks.js'

function App() {
  useGet(bookD.one, 49)

  return <div className="App"></div>
}

const { authorD, bookD, team_memberD } = open(hotel)
// сохраняем сущности из всех get-методов
// при изменении пересчитываем

// подключение определяется наличием полей сущности/get-аргументов в фронтовом сторе
console.log(bookD)
window.g = g
window.k = () => {
  // отправляем на сервер id моковой сущности при создании
  // и меняем его в связях при подтверждении
  // на сервере при каждой операции со связями смотрим, моковый ли id
  // если да, то замещаем
  // на сервере маппинг tempId-id удаляем после первой операции с новым id, или через timeout

  // моковый id в url регулируется в роутере отдельно
  // а если отправляется куда-то? на это запрет, либо нужно отправлять изменение id

  bookD.one(49).then(console.log)
  // team_memberD.one(1)
  // bookD.one(50)
}

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
