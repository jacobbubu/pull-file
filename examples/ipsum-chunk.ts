import * as path from 'path'
import { pull } from 'pull-stream'
import pullFile from '../src'

const inputFile = path.resolve(__dirname, '../test/assets/ipsum.txt')

pull(
  pullFile(inputFile, { highWaterMark: 40 }),
  pull.take(4),
  pull.drain(function(buffer) {
    console.log(buffer.toString())
  })
)
