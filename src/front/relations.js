import g from '../g.js'
import { set } from '../util.js'

export function addRelation(parentNId, path, childNId) {
  set(g.parents, [childNId, parentNId, ...path], true)
  const relation = g.parents[childNId][parentNId]

  set(g.childs, [parentNId, childNId], relation)
}

export function removeRelation(parentNId, childNId) {
  delete g.parents[childNId][parentNId]
  delete g.childs[parentNId][childNId]
  if (!Object.keys(g.childs[parentNId].length)) delete g.childs[parentNId]
  if (!Object.keys(g.parents[childNId].length)) delete g.parents[childNId]
}
