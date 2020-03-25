import * as fs from 'fs'
import * as path from 'path'
import * as pull from 'pull-stream'
import * as osenv from 'osenv'
import * as crypto from 'crypto'
import pullFile from '../src'

function hash(data: Buffer | string) {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex')
}

function asset(file: string) {
  return path.join(__dirname, 'assets', file)
}

const MB = 1024 * 1024

describe('partial', () => {
  let tmpfile: string

  beforeAll(() => {
    tmpfile = path.join(osenv.tmpdir(), 'test_pull-file_partial')
  })

  afterAll(done => {
    fs.unlink(tmpfile, done)
    done()
  })

  it('read files partially', async () => {
    const big = crypto.pseudoRandomBytes(10 * 1024 * 1024)
    fs.writeFileSync(tmpfile, big)

    function test(file: string, start: number = 0, end: number = Number.MAX_VALUE) {
      return new Promise(resolve => {
        const opts = { start: start, end: end }
        let expected: Buffer | string
        const _expected = fs.readFileSync(file)

        expected = _expected.slice(start, end || _expected.length)

        pull(
          pullFile(file, opts),
          pull.collect(function(_, ary) {
            const actual = Buffer.concat(ary as Buffer[])
            expect(actual.length).toBe(expected.length)
            expect(hash(actual)).toBe(hash(expected))
            resolve()
          })
        )
      })
    }

    await Promise.all([
      test(tmpfile, 0, 9 * MB),
      test(tmpfile, 5 * MB, 10 * MB),
      test(tmpfile, 5 * MB, 6 * MB),
      test(asset('ipsum.txt')),
      test(asset('test.txt'), 1, 4)
    ])
  })
})
