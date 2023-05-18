import { ws } from './ws.js'
import { normId } from '../utils'

// строим граф
// подписываемся на изменение сущностей

// рекурсий нет
// !(сделать и удалить) может придти id

// отношения родитель-потомок по normId

export function put(name, diff, options) {
  const { eventId } = options

  const nId = normId(name, diff.id)

  // если сущность новая id нет, генерируем его на фронте
  // после подставляем полученный с бэка и везде замещаем
}
