import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import * as osenv from 'osenv'
import * as pull from 'pull-stream'
import pullFile from '../src'

function hash(data: Buffer | string) {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex')
}

describe('large file', () => {
  let tmpfile: string

  beforeAll(() => {
    tmpfile = path.join(osenv.tmpdir(), 'test_pull-file_big')
  })

  afterAll(done => {
    fs.unlink(tmpfile, done)
    done()
  })

  it('large file', done => {
    const big = crypto.pseudoRandomBytes(10 * 1024 * 1024)
    fs.writeFileSync(tmpfile, big)
    pull(
      pullFile(tmpfile),
      pull.collect((_, items) => {
        expect(hash(big)).toBe(hash(Buffer.concat(items)))
        done()
      })
    )
  })

  it('large file as ascii strings', done => {
    const big = crypto.pseudoRandomBytes(10 * 1024 * 1024).toString('base64')
    fs.writeFileSync(tmpfile, big, 'ascii')
    pull(
      pullFile(tmpfile, { encoding: 'ascii' }),
      pull.through(function(str) {
        expect(typeof str).toBe('string')
      }),
      pull.collect((_, items) => {
        expect(hash(big)).toBe(hash(items.join('')))
        done()
      })
    )
  })
})
