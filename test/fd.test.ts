import * as fs from 'fs'
import * as path from 'path'
import * as pull from 'pull-stream'
import pullFile, { ChunkType } from '../src'

function asset(file: string) {
  return path.join(__dirname, 'assets', file)
}

function all(stream: pull.Source<ChunkType>, cb: pull.SourceCallback<ChunkType>) {
  pull(
    stream,
    pull.collect(function(err, ary: ChunkType[]) {
      cb(err, Buffer.concat(ary as Buffer[]))
    })
  )
}

describe('fd', () => {
  it('can read a file with a provided fd', done => {
    const fd = fs.openSync(asset('ipsum.txt'), 'r')

    all(pullFile(null, { fd }), function(err: pull.EndOrError, buf?: ChunkType) {
      if (err) {
        throw err
      }
      expect(buf).toBeTruthy()
      done()
    })
  })
})
