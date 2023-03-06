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

  WARNING! FULL-INTERACTION NEEDED
  for clean understanding you need to download project on your computer

  react-query требует ожидать ответа сервера
  antiq позволяет продолжить взаимодействие с сайтом
  и откатывать неуспешные изменения сервера в фоне
  все элементы интерфейса остаются активными
  формы изменяются по последнему изменению
  (если свойство затёрто и ошибочно, показывается изменённое)
  можем сделать всплывающую ошибку о том, куда редиректить при ошибке сервера на put

  этот код доступен и без активации бэка
  в таком случае всё сохраняется в локалсотрадж
  а как делать миграцию?
  структура данных изменилась -> фронтовая бд удаляет через время связанные с ней сущности
  все данные стираются, нужно создавать новые сущности
  можем перенести сущности из кэша лс функцией
  если вернулась старая конфигурация для name, возвращаем последнее значение
  все изменения door внешних апи сохраняются в стандартные фронтово-бэковые хранилища на фронте
  изменений на бэке antiq при этом стандартно не происходит
  на фронте конечно остаются лакомости в виде loading и error, как и для остальных сущностей antiq

// нужно получить массив последовательных операций и операций последущих над результатами предыдущих
// операции: выполнение функции, аргументами могут быть члены массива

  складываем информацию по тому, какими будут первые экраны
  элементы && рендерим для понимания что внутри

  массивы может нужно отфильтровать и найти что-то
  favoriteBooks.get(userId, pagination, search)

*/

// req.c - cookie
// const card = outerDoor(
//   'card',
//   {
//     title: '',
//     ctg: '',
//     i18n: [
//       {
//         creator: '',
//         txt: '',
//       },
//     ],
//   },
//   {
//     get: adminOnly((id) => {
//       return card.one(id)
//     }),
//     get: ({ filters, pagination }) => {
//       return card.o('img').get(filters, pagination)
//     },
//     put: () => { fetch('', ...) }
//   }
// )
// списки нужно уметь изменять и с пагинацией, и без неё
// по дефолту списки изменяем полностью
// put({ list: fullList }) put({ list: list(startI, deleteEl, ...items) })
// type, ...constraints
// o omit

// операторы:
// includes find order desc name desc email
// total каждого get, если есть пагинация
// door
// get put rm
// >, <, =, !=, =>, <=, &, |, ~, !~
// pagination filters search
// stone - стор для фронтовых нужд

// sql

export const users = door(
  'user',
  () => ({
    name: ['', 'primary'],
    email: ['', 'primary'],
  }),
  {
    // @form(type => type ? {
    //   email: {
    //     val: [],
    //   },
    //   name: [],
    //   nameRepeat: {
    //     deps: ['name'],
    //   },
    // } : { ...anotherForm })
    register: async ({ name, email }) => {
      // в k валидация и ошибки
      const user = users.put({
        name,
        email,
      })

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
    // можно выполнить метод извне реакта
    // и хук useData возьмёт значения из кэша, опираясь на аргументы
    login: async ({ email }) => {
      // метод возвращает сущность с val, loading, error
      // useApi(api.login) вызов api
      // useDoor(api.currentUser, args)

      // все сущности, которые находятся в результатах get
      // записываются во фронтовые сторы, даже если они внутри back
      // есть ещё safeGet, с ним фронт не засоряется

      // отслеживаем, какие сущности задействованы в каких методах
      // выполняем их снова при изменении

      const { token, user } = await back(async () => {
        const user = await users.get({ email })
        const { genToken } = require('./util')

        if (!user) throw 'no such user'

        return { token: genToken(user), user }
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
          token: genToken(users),
        }
      })
    },
  }
)

export const books = door(
  'book',
  () => ({
    name: '',
    img: '',
    authors: [authors],
    createdUser: users,
    styles: [''],
    i18n: {
      ru: { desc: '' },
      en: { desc: '' },
    },
  }),
  {
    put: [loggedOnly, (id, diff) => books.put({ id, ...diff })],
    rm: [adminOnly, (id) => books.rm(id)],
    userCreatedBooks: ({ from, to }, req) =>
      books.get({ createdUser: req.c.user }, [from, to]),
  }
)

export const authors = door(
  'author',
  () => ({
    name: '',
    img: '',
  }),
  {
    get: async (id) => {
      const [authorInst, booksPreview] = await Promise.all([
        authors.get(id),
        books('author', 'name').get(id),
      ])
      return { author: authorInst, booksPreview }
    },
    adminGet: [
      adminOnly,
      (id) => {
        return authors.get(id)
      },
    ],
    allWithoutImg: () => {
      return authors.o('img').get()
    },
    authorsOfFavoriteBooks: [
      loggedOnly,
      (pagination) => {
        return authors.get(
          // cross-request
          // у свойств-массивов есть функции js includes
          `favoriteBooks.get(favoriteBooks.author.includes(authors.id)).length > 0`,
          pagination
        )
      },
    ],
  }
)

export const booksLists = door('booksLists', () => [books])

export const favoriteBooks = door('favoriteBooks', () => [books], {
  getFavoriteBooks: [
    loggedOnly,
    ({ filters, pagination }) => favoriteBooks.get(filters, pagination),
  ],
})

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
