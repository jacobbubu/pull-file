import * as fs from 'fs'
import * as path from 'path'
import * as pull from 'pull-stream'
import * as osenv from 'osenv'
import pullFile from '../src'

const noop = () => {
  /* noop */
}

describe('append', () => {
  let tmpfile: string

  beforeAll(() => {
    tmpfile = path.join(osenv.tmpdir(), 'test_pull-file_append-' + Date.now())
  })

  afterAll(done => {
    fs.unlink(tmpfile, done)
    done()
  })

  it('append to a file', done => {
    let n = 10
    let r = 0
    let ended = false
    ;(function next() {
      --n
      fs.appendFile(tmpfile, Date.now() + '\n', function(err) {
        if (err) throw err

        if (n) {
          setTimeout(next, 20)
        } else {
          ended = true
        }
      })
    })()
    pull(
      pullFile(tmpfile, { live: true }),
      pull.through(function(chunk) {
        r++
        expect(chunk.length).not.toEqual(0)
      }),
      pull.take(10),
      pull.drain(noop, function(err) {
        if (err) {
          throw err
        }
        expect(n).toBe(0)
        expect(r).toBe(10)
        done()
      })
    )
  })
})
