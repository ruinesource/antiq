import { door, stone, back, front, list } from '*'
import Cookie from 'js-cookie'

front(async () => {
  const { default: logger } = await import('../logger')
  logger()
})

/*
  вероятно, требуется отказаться от list и использовать stone для всех списов с пагинацией и пр
  в остальных списках использовать тупо весь список всегда
  сущности маппим, как и всегда по орм

  сущности бд изменяются по последнему успешному изменению
  (если свойство затёрто и ошибочно, показывается изменённое)
  хорошая практика - всплывающая ошибка о том, куда редиректить при ошибке сервера на put
  (открывать модальное окно с не-применёнными изменениями этой сущности и ошибкой)

  код доступен без активации бэка
  сессия хранится в локалсотрадж
  миграция: структура данных изменилась -> фронт удаляет весь связанный с ней кэш
  ?если вернулась старая конфигурация для name, возвращаем последнее значение
  изменений на бэке antiq при этом стандартно не происходит
*/

// списки нужно уметь изменять и с пагинацией, и без неё
// o omit

// операторы:
// includes find order desc name desc email

// door
// get put rm
// >, =, !=, &, |, ~
// any, all
// in, not in - это то же, что any =
// any(arr, '>')

// элемент таблицы со свойством больше свойства другой таблицы, like "book.name"...
// (IN с операцией вместо строгого сравнения)

// ?
// <=, <, =>
// вместо BETWEEN используем "< AND >"
// вместо IS NULL используем "= null"
// filters pagination sort
// ?

// ошибка в случае дубля ключей

// book.get({ name: or('oki', 'doki') })
// book.get({ name: or(like('oki'), like(oki-doki)) })
// book.get({ name: more(3) })
// book.get({ name: not(more(3)) })
// book.get({ name: not(like(3)) })
// book.get({ name: and(not(like(3)), like(4)) })
// book.get([{ name: 'oki' }, { id: 'doki' }]) - or с разными свойствами

// author.get({
//   id: book.authors.s('id').out({
//     id: favoriteBooks.s('book').out({ user: userId })
//   })
// })
// author.get('(author a).id in (book.authors ba).get(ba.id )')

// sql и обновление и ререндеры по полям сущностей через код (надо оптимизацию, пиши sql)

// req, res, opts

// есть массив [action-api, action-api]
// сервер уведомляется о начале ивента и выполняет его с переданными аргументами
// фронт отправляет уведомление первым потребовавшимся элементом массива
// все подтверждения изменений в бд подтверждаются на фронте в конце ивента
// фронт приостанавливает работу тела апи (ждёт ответа сервера)
// сервер тоже может подождать внешних апи внутри back
// сервер так же может подождать результаты выполнения функции front
// на фронт отправляются результаты всех запрошенных им методов и внутренних ивентов
// (те поля сущностей, к которым он не подключён, и переменные внутри back и front)
// только в случае back, остальное синхронно
// есть лоадеры всех апи внутри метода (заканчиваются в конце метода)

// можно выполнить get извне реакта
// и хук useApi возьмёт результат из кэша, опираясь на аргументы
// отключение от подписок можно делать с помощью disconnect

    register: async ({ name, email }, opts) => {
      const user = userD.put({
        name,
        email,
      })

      try {
        await back(() => outerApi())
      } (e) {
        throw e
      }

      const token = await back(async () => {
        const redisCli = require('redis-cli')
        const {
          sendCodeToEmail,
          genActivationCode,
          genToken,
        } = require('./util')
        const activationCode = genActivationCode()

        redisCli.set(`activationCode_${activationCode}`, user.id)
        await sendCodeToEmail(email, activationCode)
        return genToken(user)
      })

      front(() => Cookie.set('token', token))
    },
    login: async ({ email }) => {
      // хук возвращает сущность с val, loading, error
      // useData(door.login, args, ?opts) -> { v, success, loading, error, total }
      // useApi(door.login, args, ?opts) -> { call, success, loading, error }

      const user = await userD.get({ email })

      const { token } = await back(async () => {
        const { genToken } = require('./util')

        if (!user) throw 'no such user'

        return { token: genToken(user) }
      })

      front(async () => {
        Cookie.set('token', token)
        Cookie.set('user', user.id)
      })
    },
    currentUser: (req) => {
      return back(() => {
        const jwt = require('jwt')
        const { getUserById, genToken } = require('./util')

        const payload = jwt.decode(req.cookie.token, 'JWT_SECRET_KEY')
        const user = getUserById(payload.id)

        if (!user) throw 'invalid token'

        return {
          user: user,
          token: genToken(user),
        }
      })
    },
  }
)

export const bookD = door(
  'book',
  () => ({
    name: '',
    img: '',
    authors: [authorD],
    createdUser: userD,
    i18n: {
      ru: { desc: '' },
      en: { desc: '' },
    },
  }),
  class X {
    @loggedOnly
    put() {}
    userCreatedBooks({ from, to }, req) {
      return bookD.get({ createdUser: req.c.user }, [from, to])
    }
  }
)

export const authorD = door(
  'author',
  () => ({
    name: '',
    img: '',
  }),
  {
    get: async (id) => {
      const [authorInst, booksPreview] = await Promise.all([
        authorD.get(id),
        bookD.select('author', 'name').get(id),
      ])
      return { author: authorInst, booksPreview }
    },
    adminGet: [
      adminOnly,
      (id) => {
        return authorD.get(id)
      },
    ],
    allWithoutImg: () => {
      return authorD.o('img').get()
    },
  }
)

export const favoriteBooksList = door(
  'favoriteBooksList',
  () => ({
    user: userD,
    book: bookD,
  }),
  class X {
    @loggedOnly
    getFavoriteBooks = [
      ({ filters, pagination }) => favoriteBooksList.get(filters, pagination),
    ],
  },
  // { primaryKey: ['user', 'book'] }
)

function loggedOnly(method) {
  return function decoratedMethod(...args) {
    if (window) return method(...args)

    const request = args[args.length - 1]
    const jwt = require('jwt')

    try {
      const token = request.headers.Authorization.replaceAll('Bearer ', '')
      jwt.decode(token, 'JWT_SECRET_KEY', ['HS256'])
      return method(...args)
    } catch (e) {
      throw { status: 403 }
    }
  }
}

function adminOnly(method) {
  return function decoratedMethod(...args) {
    if (window) return method(...args)

    const request = args[args.length - 1]
    const jwt = require('jwt')

    try {
      const token = request.headers.Authorization.replaceAll('Bearer ', '')
      const payload = jwt.decode(token, 'JWT_SECRET_KEY')

      if (payload.isAdmin) return method(...args)
    } catch (e) {
      throw { status: 403 }
    }
    throw { status: 403 }
  }
}

export const fetchData = (url, method = 'GET', body) =>
  fetch(`http://localhost:7337/${url}`, {
    body,
    method,
    headers: {
      'Content-Type': method === 'GET' ? 'text/plain' : 'application/json',
    },
  }).then((res) => res.json())
