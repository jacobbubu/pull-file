export interface Stats {
  time: number
  total: number
}

export type TaskFunc = (file: string) => Promise<Stats>
