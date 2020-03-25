import * as fs from 'fs'
import Decoder from '@jacobbubu/pull-utf8-decoder'
import { PullFileOptions } from './options'
import { Source, Abort, SourceCallback } from 'pull-stream'

export type ChunkType = Buffer | String

export default function(filename: string | null, opts: string | PullFileOptions = {}) {
  filename = filename ?? ''
  const normalizedOpts: PullFileOptions = typeof opts === 'string' ? { encoding: opts } : opts
  const mode = normalizedOpts.mode || 0x1b6 // 0666
  const bufferSize = normalizedOpts.highWaterMark || 1024 * 64
  let start = normalizedOpts.start || 0
  const end = normalizedOpts.end || Number.MAX_SAFE_INTEGER
  let fd = normalizedOpts.fd
  const flags = normalizedOpts.flags || 'r'

  let ended: Abort
  let closeNext: boolean
  let busy: boolean

  let _buffer = Buffer.alloc(bufferSize)

  let live = !!normalizedOpts.live
  let liveCb: SourceCallback<ChunkType> | null = null
  let closeCb: SourceCallback<ChunkType>

  let watcher: fs.FSWatcher
  if (live) {
    watcher = fs.watch(
      filename,
      {
        persistent: normalizedOpts.persistent !== false
      },
      function(event) {
        if (liveCb && event === 'change') {
          const cb = liveCb
          liveCb = null
          closeNext = false
          readNext(cb)
        }
      }
    )
  }

  const open = function(cb: SourceCallback<ChunkType>) {
    busy = true
    fs.open(filename!, flags, mode, function(err, descriptor) {
      // save the file descriptor
      fd = descriptor

      busy = false
      if (closeNext) {
        close(closeCb)
        return cb(closeNext)
      }

      if (err) {
        return cb(err)
      }

      // read the next bytes
      return readNext(cb)
    })
  }

  const close = function(cb: SourceCallback<ChunkType>) {
    if (!cb) throw new Error('close must have cb')
    if (watcher) {
      watcher.close()
    }
    // if auto close is disabled, then user manages fd.
    if (normalizedOpts.autoClose === false) {
      return cb(true)
    }
    // wait until we have got out of bed, then go back to bed.
    // or if we are reading, wait till we read, then go back to bed.
    else if (busy) {
      closeCb = cb
      return (closeNext = true)
    }

    // first read was close, don't even get out of bed.
    else if (!fd) {
      return cb(true)
    }

    // go back to bed
    else {
      fs.close(fd, function(err) {
        fd = undefined
        cb(err || true)
      })
    }
  }

  const readNext = function(cb: SourceCallback<ChunkType>) {
    if (closeNext) {
      if (!live) {
        close(cb)
      } else {
        liveCb = cb
      }
      return
    }

    const toRead = Math.min(end - start, bufferSize)
    busy = true

    fs.read(fd!, _buffer, 0, toRead, start, function(err, count, buffer) {
      busy = false
      start += count
      // if we have received an end notification, just discard this data
      if (closeNext && !live) {
        close(closeCb)
        return cb(closeNext)
      }

      if (ended) {
        return cb(err || ended)
      }

      // if we encountered a read error pass it on
      if (err) {
        return cb(err)
      }

      if (count === buffer.length) {
        cb(null, buffer)
      } else if (count === 0 && live) {
        liveCb = cb
        closeNext = true
      } else {
        closeNext = true
        cb(null, buffer.slice(0, count))
      }
    })
    _buffer = Buffer.alloc(Math.min(end - start, bufferSize))
  }

  const source: Source<ChunkType> = function source(end, cb) {
    if (end) {
      ended = end
      live = false
      if (liveCb) {
        liveCb(end || true)
      }
      close(cb)
    }

    // if we have already received the end notification, abort further
    else if (ended) {
      cb(ended)
    } else if (!fd) {
      open(cb)
    } else readNext(cb)
  }

  // read directly to text
  if (normalizedOpts.encoding) {
    return Decoder(normalizedOpts.encoding)(source as Source<Buffer>)
  }

  return source
}
