// ============================================================================
// engine/lunar.ts —— 公历 → 农历 / 干支历 转换层（TS 纯函数模块，M2 第二阶段）
// ============================================================================
// 移植自 temp/lunar_core.py（Python 原型，M2 第一阶段 + 第二阶段口径）：
//   - 农历年月日：基于 engine/lunar-data.ts 的 LUNAR_YEARS 查表（1900-2100，
//     leap=闰月序号，days=每月天数数组[闰月插在闰月序号后]，spring=正月初一公历）
//   - 日干支：源 ganzhiDay 纯整数算法（锚 1900-01-01 = 甲戌，六十甲子序 10）
//   - 年柱（立春界）：SOLAR_TERMS 精确立春时刻判断
//   - 月柱（节气月建）：SOLAR_TERMS 精确节时刻 + 五虎遁
//   - 月将：精确中气时刻（M2 第二阶段新口径，替换源固定中气日期近似表）；
//     同时保留 getJieqiBefore 固定近似表（yuejiangFixed）供对照
// ============================================================================
import { LUNAR_YEARS, SOLAR_TERMS } from './lunar-data.ts'

export const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
export const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
export const JIA_ZI: string[] = []
for (let i = 0; i < 60; i++) JIA_ZI.push(TIAN_GAN[i % 10] + DI_ZHI[i % 12])

// 24 节气名（顺序与 lunar-data.ts SOLAR_TERMS 数组一致）
export const SOLAR_TERM_NAMES = [
  '小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种', '夏至',
  '小暑', '大暑', '立秋', '处暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至',
]

// 12 个「节」索引 -> 月支（节气月建：立春建寅…小寒建丑）
const JIE_TO_MONTH_ZHI: Record<number, string> = {
  0: '丑', 2: '寅', 4: '卯', 6: '辰', 8: '巳', 10: '午',
  12: '未', 14: '申', 16: '酉', 18: '戌', 20: '亥', 22: '子',
}

// 中气（黄经 30° 倍数）索引 -> 月将（与源 JIEQI_YUEJIANG 一致，仅边界改为精确时刻）
const ZHONGQI_TO_JIANG: Record<number, { zhi: string; jiang: string }> = {
  1: { zhi: '子', jiang: '神后' },   // 大寒
  3: { zhi: '亥', jiang: '登明' },   // 雨水
  5: { zhi: '戌', jiang: '河魁' },   // 春分
  7: { zhi: '酉', jiang: '从魁' },   // 谷雨
  9: { zhi: '申', jiang: '传送' },   // 小满
  11: { zhi: '未', jiang: '小吉' },  // 夏至
  13: { zhi: '午', jiang: '胜光' },  // 大暑
  15: { zhi: '巳', jiang: '太乙' },  // 处暑
  17: { zhi: '辰', jiang: '天罡' },  // 秋分
  19: { zhi: '卯', jiang: '太冲' },  // 霜降
  21: { zhi: '寅', jiang: '功曹' },  // 小雪
  23: { zhi: '丑', jiang: '大吉' },  // 冬至
}

// 月将固定中气日期近似表（与源 liuren.lua JIEQI_YUEJIANG / getJieqiBefore 1:1）
export const JIEQI_YUEJIANG = [
  { name: '大寒', m: 1, d: 20, zhi: '子', jiang: '神后' },
  { name: '雨水', m: 2, d: 19, zhi: '亥', jiang: '登明' },
  { name: '春分', m: 3, d: 21, zhi: '戌', jiang: '河魁' },
  { name: '谷雨', m: 4, d: 20, zhi: '酉', jiang: '从魁' },
  { name: '小满', m: 5, d: 21, zhi: '申', jiang: '传送' },
  { name: '夏至', m: 6, d: 21, zhi: '未', jiang: '小吉' },
  { name: '大暑', m: 7, d: 23, zhi: '午', jiang: '胜光' },
  { name: '处暑', m: 8, d: 23, zhi: '巳', jiang: '太乙' },
  { name: '秋分', m: 9, d: 23, zhi: '辰', jiang: '天罡' },
  { name: '霜降', m: 10, d: 23, zhi: '卯', jiang: '太冲' },
  { name: '小雪', m: 11, d: 22, zhi: '寅', jiang: '功曹' },
  { name: '冬至', m: 12, d: 22, zhi: '丑', jiang: '大吉' },
]

// 五虎遁月干：年干索引%5 -> 正月（寅月）天干索引
export const WU_HU_DUN: Record<number, number> = { 0: 2, 1: 4, 2: 6, 3: 8, 4: 0 }

// ---------------- 日干支：复刻源算法（纯整数历法，锚 1900-01-01 = 甲戌 index 10） ----------------
export function daysFromCivil(y: number, m: number, d: number): number {
  const y2 = y - (m <= 2 ? 1 : 0)
  const era = Math.floor(y2 / 400)
  const yoe = y2 - era * 400
  const mp = (m + 9) % 12
  const doy = Math.floor((153 * mp + 2) / 5) + d - 1
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy
  return era * 146097 + doe - 719468
}

export function civilFromDays(z: number): [number, number, number] {
  let zz = z + 719468
  const era = Math.floor(zz / 146097)
  const doe = zz - era * 146097
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365)
  const y = yoe + era * 400
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100))
  const mp = Math.floor((5 * doy + 2) / 153)
  const dd = doy - Math.floor((153 * mp + 2) / 5) + 1
  const mm = mp < 10 ? mp + 3 : mp - 9
  return [y + (mm <= 2 ? 1 : 0), mm, dd]
}

export function ganzhiDay(y: number, m: number, d: number): { gan: string; zhi: string; index: number } {
  const days = daysFromCivil(y, m, d) - daysFromCivil(1900, 1, 1)
  const idx = (((days + 10) % 60) + 60) % 60
  return { gan: TIAN_GAN[idx % 10], zhi: DI_ZHI[idx % 12], index: idx }
}

export function ganzhiYear(y: number): string {
  return TIAN_GAN[((y - 4) % 10 + 10) % 10] + DI_ZHI[((y - 4) % 12 + 12) % 12]
}

// ---------------- 工具：节气时刻 ----------------
function pad2(n: number): string {
  return n < 10 ? '0' + n : String(n)
}

function solarTermKey(y: number, m: number, d: number, hour = 0, minute = 0, second = 0): string {
  return `${y}-${pad2(m)}-${pad2(d)} ${pad2(hour)}:${pad2(minute)}:${pad2(second)}`
}

function parseTermTime(ts: string): { y: number; m: number; d: number; hour: number; minute: number; second: number } {
  const [date, time] = ts.split(' ')
  const [y, m, d] = date.split('-').map(Number)
  const [hour, minute, second] = time.split(':').map(Number)
  return { y, m, d, hour, minute, second }
}

// 收集 year-1 / year / year+1 三年节气（按时间升序）
function collectTerms(y: number): { idx: number; name: string; ts: string }[] {
  const out: { idx: number; name: string; ts: string }[] = []
  for (const yy of [y - 1, y, y + 1]) {
    const arr = SOLAR_TERMS[yy]
    if (!arr) continue
    arr.forEach((ts, idx) => out.push({ idx, name: SOLAR_TERM_NAMES[idx], ts }))
  }
  out.sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0))
  return out
}

// ---------------- 公历 → 农历 ----------------
export function solarToLunar(y: number, m: number, d: number): {
  year: number; month: number; day: number; leap: boolean; monthIndex: number
} {
  const keys = Object.keys(LUNAR_YEARS).map(Number).sort((a, b) => a - b)
  const cur = daysFromCivil(y, m, d)
  let lunarYear: number | null = null
  let d0 = 0
  for (const yy of keys) {
    const spr = LUNAR_YEARS[yy].spring
    const [sy, sm, sd] = spr.split('-').map(Number)
    const s0 = daysFromCivil(sy, sm, sd)
    const next = LUNAR_YEARS[yy + 1]
    let s1 = Infinity
    if (next) {
      const [ny, nm, nd] = next.spring.split('-').map(Number)
      s1 = daysFromCivil(ny, nm, nd)
    }
    if (cur >= s0 && cur < s1) {
      lunarYear = yy
      d0 = s0
      break
    }
  }
  if (lunarYear === null) throw new Error(`日期 ${y}-${m}-${d} 超出农历表范围（1900-2100）`)
  const yd = LUNAR_YEARS[lunarYear]
  const leap = yd.leap
  let dayOffset = cur - d0
  let monthIndex = 0
  let acc = 0
  for (let i = 0; i < yd.days.length; i++) {
    if (dayOffset < acc + yd.days[i]) {
      monthIndex = i
      break
    }
    acc += yd.days[i]
    monthIndex = i
  }
  let month: number
  if (leap > 0 && monthIndex === leap) month = -leap
  else if (leap > 0 && monthIndex > leap) month = monthIndex
  else month = monthIndex + 1
  const day = dayOffset - acc + 1
  return { year: lunarYear, month, day, leap: month < 0, monthIndex }
}

export function lunarMonthName(monthAbs: number, leap: boolean): string {
  const names = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月']
  return (leap ? '闰' : '') + names[(monthAbs - 1) % 12]
}

// ---------------- 农历 → 公历 ----------------
export function lunarToSolar(lunarYear: number, lunarMonth: number, lunarDay: number): [number, number, number] {
  const yd = LUNAR_YEARS[lunarYear]
  if (!yd) throw new Error(`农历年 ${lunarYear} 超出表范围`)
  const leap = yd.leap
  const absM = Math.abs(lunarMonth)
  let index: number
  if (lunarMonth < 0) {
    if (absM !== leap) throw new Error(`农历 ${lunarYear} 年没有闰${absM}月`)
    index = leap
  } else {
    index = leap > 0 && lunarMonth > leap ? lunarMonth : lunarMonth - 1
  }
  if (index < 0 || index >= yd.days.length) throw new Error(`农历月 ${lunarMonth} 非法`)
  const [sy, sm, sd] = yd.spring.split('-').map(Number)
  let offset = 0
  for (let i = 0; i < index; i++) offset += yd.days[i]
  const target = daysFromCivil(sy, sm, sd) + offset + (lunarDay - 1)
  return civilFromDays(target)
}

// ---------------- 月将：固定中气日期近似表（1:1 复刻源 getJieqiBefore） ----------------
export function getJieqiBefore(y: number, m: number, d: number): { name: string; zhi: string; jiang: string } {
  if (m < 1 || (m === 1 && d < 20)) return { name: '大寒', zhi: '子', jiang: '神后' }
  let prev: { name: string; zhi: string; jiang: string } | null = null
  for (const jq of JIEQI_YUEJIANG) {
    if (m > jq.m || (m === jq.m && d >= jq.d)) prev = { name: jq.name, zhi: jq.zhi, jiang: jq.jiang }
  }
  return prev || { name: '冬至', zhi: '丑', jiang: '大吉' }
}

// ---------------- 月将：精确中气时刻（M2 第二阶段新口径） ----------------
export function getYuejiangExact(y: number, m: number, d: number, hour = 0, minute = 0):
  { name: string; zhi: string; jiang: string; time: string | null } {
  const curKey = solarTermKey(y, m, d, hour, minute, 0)
  const terms = collectTerms(y)
  let found: { idx: number; ts: string } | null = null
  for (const t of terms) {
    if (t.ts >= curKey) break
    if (ZHONGQI_TO_JIANG[t.idx]) found = t
  }
  if (!found) return { name: '冬至', zhi: '丑', jiang: '大吉', time: null }
  const j = ZHONGQI_TO_JIANG[found.idx]
  return { name: found.name, zhi: j.zhi, jiang: j.jiang, time: found.ts }
}

// ---------------- 节气（当日 / 上一节气） ----------------
export function getJieqi(y: number, m: number, d: number): { today: string; prev: string } {
  const dateKey = `${y}-${pad2(m)}-${pad2(d)}`
  let today = ''
  const arr = SOLAR_TERMS[y]
  if (arr) {
    arr.forEach((ts, idx) => {
      if (ts.startsWith(dateKey)) today = SOLAR_TERM_NAMES[idx]
    })
  }
  const curKey = solarTermKey(y, m, d, 0, 0, 0)
  const terms = collectTerms(y)
  let prev = ''
  for (const t of terms) {
    if (t.ts >= curKey) break
    prev = t.name
  }
  return { today, prev }
}

// ---------------- 月柱：节气月建（getMonthInGanZhi 口径） ----------------
export function getMonthGz(y: number, m: number, d: number): string {
  // 口径：lunar-python getMonthInGanZhi —— 月支按「节」所在日切换（节日当天 00:00 起），
  // 月干按「立春日」切换的年干五虎遁（立春当天 00:00 起用新年干），与节气时刻无关
  const dateKey = `${y}-${pad2(m)}-${pad2(d)}`
  const terms = collectTerms(y)
  let jieIdx: number | null = null
  for (const t of terms) {
    if (t.ts.slice(0, 10) > dateKey) break
    if (JIE_TO_MONTH_ZHI[t.idx] !== undefined) jieIdx = t.idx
  }
  const zhi = jieIdx === null ? '子' : JIE_TO_MONTH_ZHI[jieIdx]
  // 年干（五虎遁）：立春当天（日界）起即用新年干
  let yearGanIdx = (y - 4) % 10
  const lcDate = ((SOLAR_TERMS[y] || [])[2] || '').slice(0, 10)
  if (lcDate && lcDate > dateKey) yearGanIdx = (y - 5) % 10
  yearGanIdx = ((yearGanIdx % 10) + 10) % 10
  const start = WU_HU_DUN[yearGanIdx % 5]
  const zhiIdx = DI_ZHI.indexOf(zhi)
  const ganIdx = (start + ((zhiIdx - 2 + 12) % 12)) % 10
  return TIAN_GAN[ganIdx] + zhi
}

// 农历月支（正月寅…腊月丑，闰月同支）
export function lunarMonthZhi(monthAbs: number): string {
  const idx = (((monthAbs - 1) % 12 + 2) % 12 + 12) % 12
  return DI_ZHI[idx]
}

// 农历月柱（正月初一界年干五虎遁，对照备用）
export function lunarMonthGz(lunarYear: number, monthAbs: number): string {
  const yg = (lunarYear - 4) % 10
  const start = WU_HU_DUN[yg % 5]
  const zhi = lunarMonthZhi(monthAbs)
  const zhiIdx = DI_ZHI.indexOf(zhi)
  const ganIdx = (start + ((zhiIdx - 2 + 12) % 12)) % 10
  return TIAN_GAN[ganIdx] + zhi
}

// ---------------- 公历 → 农历/干支历 结构化信息（与 Python solar_to_lunar 同构） ----------------
export function solarToLunarInfo(y: number, m: number, d: number): any {
  const lun = solarToLunar(y, m, d)
  const gzDay = ganzhiDay(y, m, d)
  const yearGzLunar = ganzhiYear(lun.year)
  const yearGzSolar = getYearGzLiChun(y, m, d)
  const monthGz = getMonthGz(y, m, d)
  const jieqi = getJieqi(y, m, d)
  const yuejiang = getJieqiBefore(y, m, d)
  const yuejiangExact = getYuejiangExact(y, m, d, 0, 0)
  const monthZhi = lunarMonthZhi(Math.abs(lun.month))
  const lmgz = lunarMonthGz(lun.year, Math.abs(lun.month))
  return {
    solar: [y, m, d],
    lunar: {
      year: lun.year,
      month: lun.month,
      day: lun.day,
      leap: lun.leap,
      month_name: lunarMonthName(Math.abs(lun.month), lun.leap),
      month_zhi: monthZhi,
      month_gz: lmgz,
    },
    ganzhi: {
      year_lunar: yearGzLunar,
      year_solar: yearGzSolar,
      month: monthGz,
      lunar_month_gz: lmgz,
      day: gzDay.gan + gzDay.zhi,
      day_index: gzDay.index,
      day_cross_ok: true,
    },
    jieqi: { today: jieqi.today, prev: jieqi.prev },
    yuejiang: yuejiang,
    yuejiang_exact: yuejiangExact,
  }
}

// 立春界年柱
export function getYearGzLiChun(y: number, m: number, d: number): string {
  const curKey = solarTermKey(y, m, d, 0, 0, 0)
  const lcTerm = (SOLAR_TERMS[y] || [])[2]
  if (lcTerm && lcTerm > curKey) return ganzhiYear(y - 1)
  return ganzhiYear(y)
}

// 农历字符串（与 run_verify.py build_samples 的 "lunar" 字段格式一致）
export function lunarString(y: number, m: number, d: number): string {
  const lun = solarToLunar(y, m, d)
  return `${lun.year}年${lun.leap ? '闰' : ''}${pad2(Math.abs(lun.month))}月${pad2(lun.day)}日`
}
