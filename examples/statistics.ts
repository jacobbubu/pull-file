// copied from https://github.com/dominictarr/statistics/blob/master/index.js
export interface Summary {
  mean: number
  stdev: number
  count: number
  sum: number
  sqsum: number
}

export type Reducer = (acc: Summary, value: number) => Summary

export function reduce(acc?: Summary | null | number, value?: number): Summary {
  // handle when called without initial
  if ('number' === typeof acc) {
    return reduce(reduce(null, acc), value)
  }
  // set initial if initial was null
  else if (null === acc || 'undefined' === typeof acc) {
    value = value || 0
    return {
      mean: value,
      stdev: 0,

      count: 1,
      sum: value,
      sqsum: value * value
    }
  }
  const sum = acc.sum + value
  const count = acc.count + 1
  const sq = value * value

  const mean = sum / count
  const sqsum = acc.sqsum + sq

  return {
    // these values useful output
    mean,
    stdev: Math.sqrt(sqsum / count - mean * mean),

    // these values needed to maintain state.
    count,
    sum,
    sqsum
  }
}
