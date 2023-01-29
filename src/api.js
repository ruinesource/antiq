import { door, stone, back, front } from '*'
import Cookie from 'js-cookie'

front(async () => {
  const { default: logger } = await import('../logger')
  logger()
})

/*
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

  складываем информацию по тому, какими будут первые экраны
  элементы && рендерим для понимания что внутри
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
//       return card.k.get(id)
//     }),
//     many: ({ filters, pagination }) => {
//       return card.k.omit('img').many(filters, pagination)
//     },
//     put: () => { fetch('', ...) }
//   }
// )
// списки нужно уметь изменять и с пагинацией, и без неё
// по дефолту списки изменяем полностью
// put({ list: fullList }) put({ list: splice(startI, deleteEl, ...items) })
// type, ...constraints

// операторы:
// >, <, =, !=, =>, <=, and, or, ~~, !~~
// total каждого many, если есть пагинация, order desc name desc email
// k
// one
// many
// put
// rm
// sql

export const userDoor = door(
  'user',
  () => ({
    name: ['', 'required'],
    email: ['', 'primary'],
  }),
  {
    @form({
      email: {
        val: [],
      },
      name: [],
      nameRepeat: {
        deps: ['name'],
      },
    })
    register: async ({ name, email }) => {
      // в k валидация и ошибки
      const user = userDoor.k.put({
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
    login: async ({ email }) => {
      const [token] = await Promise.all([
        back(async () => {
          const user = await userDoor.k.one(`user.email = ${email}`)
          const { genToken } = require('./util')

          return genToken(user)
        }),

        userDoor.one(`user.email = '${email}'`),
      ])

      front(async () => {
        const { default: Cookie } = await import('Cookie')

        Cookie.set('token', token)
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
          token: genToken(userDoor),
        }
      })
    },
  }
)

export const bookDoor = door(
  'book',
  () => ({
    name: '',
    img: '',
    authors: [authorDoor],
    createdUser: userDoor,
    i18n: {
      ru: { desc: '' },
      en: { desc: '' },
    },
  }),
  {
    put: [loggedOnly, (id, diff) => bookDoor.k.put({ id, ...diff })],
    rm: [adminOnly, (id) => bookDoor.k.rm(id)],
    userCreatedBooks: (req) => bookDoor.k.many(`createdUser = ${req.c.userId}`),
  }
)

export const authorDoor = door(
  'author',
  () => ({
    name: '',
    img: '',
  }),
  {
    get: async (id) => {
      const [authorInst, booksPreview] = await Promise.all([
        authorDoor.k.one({ id }),
        bookDoor.k.sel('author', 'name').one(`author.id = ${id}`),
      ])
      return { author: authorInst, booksPreview }
    },
    adminGet: [
      adminOnly,
      (id) => {
        return authorDoor.k.one({ id })
      },
    ],
    allWithoutImg: () => {
      return authorDoor.k.omit('img').many()
    },
    favoriteBooksAuthors: [
      loggedOnly,
      () => {
        return authorDoor.k.many(
          // cross-request
          `favoriteBooks.k.one
            author = favoriteBooks.author
        `
        )
      },
    ],
  }
)

export const favoriteBooksStone = stone('favoriteBooks', () => [bookDoor], {
  many: [
    loggedOnly,
    // stone делает фильтр по id (user по дефолту)
    ({ filters, pagination }) => favoriteBooksStone.k.many(filters, pagination),
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
