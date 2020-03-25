export interface ReadStreamOptions {
  flags?: string
  encoding?: string
  fd?: number
  mode?: number
  autoClose?: boolean
  /**
   * @default false
   */
  emitClose?: boolean
  start?: number
  end?: number
  highWaterMark?: number
}

export interface PullFileOptions extends ReadStreamOptions {
  persistent?: boolean
  /**
   * @default false
   */
  live?: boolean
}
