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

  нужно получить массив последовательных операций и операций последущих над результатами предыдущих
  операции: выполнение функции, аргументами могут быть элементы массива

  складываем информацию по тому, какими будут первые экраны
  элементы && рендерим для понимания что внутри?

  массивы может нужно отфильтровать и найти что-то
  favoriteBook.get(userId, pagination, search)
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

// вопрос: как синхронизировать сущности из разных методов
// в разных методах приходят разные поля
// ответ: сохраняем

// операторы:
// includes find order desc name desc email
// total каждого get, если возвращается массив
// door
// get put rm
// >, =, !=, &, |, ~
// any, all
// in, not in - это то же, что any =, all !=

// элемент таблицы со свойством больше свойства другой таблицы, like "book.name"...
// (IN с операцией вместо строгого сравнения)

// <=, <, =>
// вместо BETWEEN используем "< AND >"
// вместо IS NULL используем "= null"
// filters pagination sort
// stone - стор для фронтовых нужд

// в door.o() и door.s в случае других таблиц в запросе может содержать их поля
// ошибка в случае дубля ключей

// book.get({ name: or('oki', 'doki') })
// book.get({ name: or(like('oki'), like(oki-doki)) })
// book.get({ name: more(3) })
// book.get({ name: not(more(3)) })
// book.get({ name: not(like(3)) })
// book.get([{ name: 'oki' }, { id: 'doki' }]) - or с разными свойствами

// author.get({
//   id: any(
//     book.authors.s('id').innerGet({
//       id: any(
//         favoriteBooks.s('book').innerGet({ user: userId })
//       )
//     })
//   )
// })
// author.get('(author a).id in (book.authors ba).get(ba.id )')

// sql
// sum не существует, или sql или считать через код
// (надо оптимизацию, пиши sql)
// sql статичны
// если хочется обновлений, есть функция, в которой определяется при изменении каких полей каких таблиц(сущностей) обновляться

export const userD = door(
  'user',
  () => ({
    name: '',
    email: '',
  }),
  {
    // @form({
    //   email: {
    //     validators: [],
    //   },
    //   name: [],
    //   nameRepeat: {
    //     validators: [required, { deps: ['name'], fn: (v, name) => '...' }],
    //   },
    // })

    // создаём methodId и innerMethodId
    // добавляем его к каждому put, get и rm при отправке на сервер
    // случаи ошибки на фронте и сервере и как отменять изменения
    // на бэке можем использовать транзакции, в случае ошибки фронта изменения сохраняются
    // на фронте сначала делаем массив новых сущностей, а на ошибку изменения не применяем

    register: async ({ name, email }) => {
      // эта штука нужна
      const userApi = userD.innerApi()

      const user = userApi.put({
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
    // и хук useApi возьмёт значения из кэша, опираясь на аргументы
    // отключение от подписок можно делать с помощью disconnect
    login: async ({ email }) => {
      // хук возвращает сущность с val, loading, error
      // useApi(api.login, args, ?options) -> { v, loading, error }

      // а массивы? сортировка/фильтрация/пагинация
      // для них свои door, свои апи методы получения
      // { pagination, filters }

      // все сущности, которые находятся в результатах get
      // записываются во фронтовые сторы, даже если они внутри back

      // отслеживаем, какие сущности задействованы в каких методах
      // выполняем апи снова при их изменении (посчитать calculated свойства)
      // ?выполняем методы на put/rm каждой дб, задействованой внутри апи

      const { token, user } = await back(async () => {
        const user = await userD.get({ email })
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
    styles: [''],
    i18n: {
      ru: { desc: '' },
      en: { desc: '' },
    },
  }),
  {
    put: [loggedOnly, (id, diff) => bookD.put({ id, ...diff })],
    rm: [adminOnly, (id) => bookD.rm(id)],
    userCreatedBooks: ({ from, to }, req) =>
      bookD.get({ createdUser: req.c.user }, [from, to]),
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
    authorsOfFavoriteBooks: [
      loggedOnly,
      (pag) => {
        return authorD.get(
          // в js есть итерации с выполнением функции
          // get и put
          // в их аргументы передаются

          // (author) => favoriteBook.get(
          //   author.id
          // )
          // ?у массивов внутри объектов есть все методы массивов js?

          // все сравнения, у которых аргумент переменная, зависимая от дб
          // доступны только через act
          // без него можно сравнивать только со строгими величинами

          // cross-request (между разными дб) доступен только через act
          // надо придумать способы преобразования форматов данных внутри (Number, String?)

          `favoriteBook.get(
            favoriteBook.authors.includes(authors.id)
          ).length > 0`,
          { pag }
        )
      },
    ],
  }
)

export const favoriteBooksList = door(
  'favoriteBooksList',
  () => ({
    user: userD,
    book: bookD,
  }),
  {
    getFavoriteBooks: [
      loggedOnly,
      ({ filters, pagination }) => favoriteBooksList.get(filters, pagination),
    ],
  },
  { id: false }
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
