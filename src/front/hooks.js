import { action } from './door.js'
import { get } from './get.js'

// подписываемся на поля door
// отправляем экшн на сервер, подписываемся там тоже
export function useGet(fn, ...args) {
  const get = fn(...args)
}
