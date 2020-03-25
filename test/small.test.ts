import * as path from 'path'
import * as pull from 'pull-stream'
import pullFile, { ChunkType } from '../src'

describe('basic', () => {
  it('small text', done => {
    pull(
      pullFile(path.resolve(__dirname, 'assets', 'test.txt')),
      pull.map((data: ChunkType) => data.toString()),
      pull.collect((_, items) => {
        expect(items.join('')).toBe('hello')
        done()
      })
    )
  })
  it('buffer size respected', done => {
    const expected = ['he', 'll', 'o']
    pull(
      pullFile(path.resolve(__dirname, 'assets', 'test.txt'), { highWaterMark: 2 }),
      pull.drain(data => {
        expect(data.toString()).toBe(expected.shift())
        done()
      })
    )
  })
})
