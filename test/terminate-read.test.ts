import * as fs from 'fs'
import * as path from 'path'
import * as pull from 'pull-stream'
import pullFile, { ChunkType } from '../src'

const ipsum = path.resolve(__dirname, 'assets', 'ipsum.txt')

describe('terminate read', () => {
  it('can terminate read process', done => {
    const expected = [
      'Lorem ipsum dolor sit amet, consectetur ',
      'adipiscing elit. Quisque quis tortor eli',
      't. Donec vulputate lacus at posuere soda',
      'les. Suspendisse cursus, turpis eget dap'
    ]
    pull(
      pullFile(ipsum, { highWaterMark: 40 }),
      pull.take(expected.length),
      pull.drain(
        function(data) {
          expect(data.toString()).toBe(expected.shift())
        },
        function(err) {
          if (err) throw err
          done()
        }
      )
    )
  })

  it('can terminate file immediately (before open)', done => {
    const source = pullFile(ipsum)
    let sync = false
    source(true, function(end: pull.EndOrError) {
      sync = true
      expect(end).toBeTruthy()
      done()
    })
    expect(sync).toBeTruthy()
  })

  it('can terminate file immediately (after open)', done => {
    const source = pullFile(ipsum)
    let sync1 = false
    let sync2 = false

    source(null, function(end: pull.EndOrError, data?: ChunkType) {
      if (sync1) {
        throw new Error('read1 called twice')
      }
      sync1 = true
      expect(end).toBeTruthy()
      expect(data).toBeUndefined()
    })

    source(true, function(end: pull.EndOrError) {
      if (sync2) {
        throw new Error('read2 called twice')
      }
      sync2 = true
      expect(sync1).toBeTruthy()
      expect(end).toBeTruthy()
      done()
    })
    expect(sync1).toBeFalsy()
    expect(sync2).toBeFalsy()
  })
})
