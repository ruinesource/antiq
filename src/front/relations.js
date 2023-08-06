import g from '../g.js'
import { set } from '../utils.js'

export function addRelation(parentNId, path, childNId) {
  set(g.parents, [childNId, parentNId, ...path], true)
  set(g.childs, [parentNId, childNId, ...path], true)
}

export function removeRelation(parentNId, childNId) {
  delete g.parents[childNId][parentNId]
  delete g.childs[parentNId][childNId]
  if (!Object.keys(g.childs[parentNId].length)) delete g.childs[parentNId]
  if (!Object.keys(g.parents[childNId].length)) delete g.parents[childNId]
}
