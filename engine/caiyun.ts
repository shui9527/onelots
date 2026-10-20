// ============================================================================
// engine/caiyun.ts —— 财运每日签（TS 纯函数模块，M2 第二阶段）
// ============================================================================
// 移植自 temp/caiyun_proto.py（1:1 复刻源 h5-game/scripts/caiyun.lua）：
//   - 独立 xorshift32（mulberry32 变体）PRNG，种子 = 日期数字（如 20261018），
//     不触碰全局随机状态
//   - 12 生肖 Fisher-Yates 洗牌取前 8 个为卦象（顺序即洗牌后顺序）
//   - 首位生肖定谶言池（6 条/生肖，共 72 条），抽 1 条
//   - 同一日期内任意时刻结果完全一致（确定性）；跨日换签
//   - todayKey 使用东八区（Asia/Shanghai）日期
// 数据（ZODIAC / POEMS）与项目 data/caiyun.ts 同源（逐条对照 caiyun.lua）
// ============================================================================
import { ZODIAC, POEMS } from '../data/caiyun.ts'

export { ZODIAC, POEMS }

export class PRNG {
  state: number
  constructor(seed: number) {
    let s = (seed % 4294967296) + 1
    if (s === 0) s = 1
    this.state = s >>> 0
  }
  next(): number {
    this.state = (this.state + 0x6d2b79f5) % 4294967296
    let z = this.state
    z = z ^ (z >>> 15)
    z = (z ^ ((z << 7) & 0xffffffff)) >>> 0
    z = z ^ (z >>> 9)
    return z >>> 0
  }
  float(): number {
    return this.next() / 4294967296
  }
  int(n: number): number {
    return (this.next() % n) + 1
  }
}

export function fisherYates(rng: PRNG, items: string[]): string[] {
  const n = items.length
  for (let i = n; i >= 2; i--) {
    const j = rng.int(i) - 1
    const tmp = items[i - 1]
    items[i - 1] = items[j]
    items[j] = tmp
  }
  return items
}

export function seedFromDate(dateKey: string): number {
  const digits = (dateKey || '').replace(/\D/g, '')
  let seed = digits ? parseInt(digits, 10) : 0
  if (!seed || seed <= 0) seed = 20261018
  return seed
}

export interface CaiyunResult {
  date: string
  zodiac: string[]
  head: string
  poem: string
}

export function caiyunNow(dateKey: string): CaiyunResult {
  const seed = seedFromDate(dateKey)
  const rng = new PRNG(seed)
  const deck = [...ZODIAC]
  fisherYates(rng, deck)
  const zodiac = deck.slice(0, 8)
  const head = zodiac[0]
  const pool = POEMS[head] || POEMS['鼠']
  const poem = pool[rng.int(pool.length) - 1]
  return { date: dateKey, zodiac, head, poem }
}

// 东八区 todayKey（"YYYY-MM-DD"）
export function todayKeyEast8(now?: Date): string {
  const dt = now || new Date()
  const east8 = new Date(dt.getTime() + 8 * 3600 * 1000)
  const y = east8.getUTCFullYear()
  const m = east8.getUTCMonth() + 1
  const d = east8.getUTCDate()
  const p = (n: number) => (n < 10 ? '0' + n : String(n))
  return `${y}-${p(m)}-${p(d)}`
}

export function caiyunToday(now?: Date): CaiyunResult {
  return caiyunNow(todayKeyEast8(now))
}
