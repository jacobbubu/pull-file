import * as path from 'path'
import { reduce, Summary } from './statistics'
import { Stats, TaskFunc } from './common'
import pullRate from './rate'
import nodeRate from './node-rate'

const inputFile = process.argv[2] ?? path.resolve(__dirname, '../test/assets/ipsum.txt')

const bench = async (a: TaskFunc, b: TaskFunc, N: number = 20) => {
  const resultsA: Stats[] = []
  const resultsB: Stats[] = []
  let A: Stats
  let B: Stats
  let sA = reduce()
  let sB = reduce()

  let wins = 0

  const runOneTask = async (t: TaskFunc, book: Stats[], summary: Summary) => {
    const stats = await t(inputFile)
    const time = stats.time / 1000 || 0.000001
    const size = stats.total / (1024 * 1024)
    book.push(stats)
    summary = reduce(summary, size / time)
    return { stats, summary }
  }

  for (let i = 0; i < N; i++) {
    if (Math.random() >= 0.5) {
      const rA = await runOneTask(a, resultsA, sA)
      A = rA.stats
      sA = rA.summary
      const rB = await runOneTask(a, resultsB, sB)
      B = rB.stats
      sB = rB.summary
    } else {
      const rB = await runOneTask(a, resultsB, sB)
      B = rB.stats
      sB = rB.summary
      const rA = await runOneTask(a, resultsA, sA)
      A = rA.stats
      sA = rA.summary
    }
    if (A.time < B.time) {
      wins++
    }
  }

  console.log('A: pull-stream')
  console.log(sA)
  console.log('B: node stream')
  console.log(sB)
  console.log('chance A wins:', wins / N, wins, N - wins)
}

// tslint:disable-next-line no-floating-promises
bench(pullRate, nodeRate)
