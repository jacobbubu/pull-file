import * as fs from 'fs'
import * as path from 'path'
import * as pull from 'pull-stream'
import pullFile from '../src'

function asset(file: string) {
  return path.join(__dirname, 'assets', file)
}

function all(stream: pull.Source<Buffer> | pull.Source<String>, cb: any) {
  pull(
    stream,
    pull.collect(function(err, ary) {
      cb(err, Buffer.concat(ary))
    })
  )
}

describe('fd', () => {
  it('can read a file with a provided fd', done => {
    const fd = fs.openSync(asset('ipsum.txt'), 'r')

    all(pullFile(null, { fd }), function(err: pull.CbError, buf: Buffer) {
      if (err) {
        throw err
      }
      expect(buf).toBeTruthy()
      done()
    })
  })
})
