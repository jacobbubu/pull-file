import * as path from 'path'
import * as pull from 'pull-stream'
import pullFile from '../src'
import { Stats, TaskFunc } from './common'

const inputFile = process.argv[2] ?? path.resolve(__dirname, '../test/assets/ipsum.txt')

const rate: TaskFunc = async (file: string) => {
  return new Promise<Stats>(resolve => {
    const start = Date.now()
    let total = 0
    pull(
      pullFile(file),
      pull.drain(
        function(b) {
          total += b.length
        },
        function() {
          resolve({ time: Date.now() - start, total: total })
        }
      )
    )
  })
}

if (!module.parent) {
  const main = async (file: string) => {
    const stats = await rate(inputFile)
    const seconds = stats.time / 1000
    const mb = stats.total / (1024 * 1024)
    console.log(
      `took ${seconds} sec read file(${inputFile}) that sized ${mb} mb and the throughput is ${mb /
        seconds} mb/sec`
    )
  }

  // tslint:disable-next-line no-floating-promises
  main(inputFile)
}

export default rate
