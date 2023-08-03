import { atom } from '../../vanilla.ts'
import type { SetStateAction, WritableAtom } from '../../vanilla.ts'
import { RESET } from './constants.ts'

type Read<Value, Args extends unknown[], Result> = WritableAtom<
  Value,
  Args,
  Result
>['read']

export function atomWithDefault<Value>(
  getDefault: Read<Value, [SetStateAction<Value> | typeof RESET], void>
): WritableAtom<Value, [SetStateAction<Value> | typeof RESET], void> {
  const EMPTY = Symbol()
  const overwrittenAtom = atom<Value | typeof EMPTY>(EMPTY)

  if (import.meta.env?.MODE !== 'production') {
    overwrittenAtom.debugPrivate = true
  }

  const anAtom: WritableAtom<
    Value,
    [SetStateAction<Value> | typeof RESET],
    void
  > = atom(
    (get, options) => {
      const overwritten = get(overwrittenAtom)
      if (overwritten !== EMPTY) {
        // 值被修改过后使用 overwrittenAtom
        return overwritten
      }
      // 调用read函数获取默认值
      return getDefault(get, options)
    },
    (get, set, update) => {
      if (update === RESET) {
        // 重置数据
        set(overwrittenAtom, EMPTY)
      } else if (typeof update === 'function') {
        // 修改数据
        const prevValue = get(anAtom)
        set(overwrittenAtom, (update as (prev: Value) => Value)(prevValue))
      } else {
        // 修改数据
        set(overwrittenAtom, update)
      }
    }
  )
  return anAtom
}
