// ============================================================================
// engine/liuyao.ts —— 六爻（纳甲筮法）TS 纯函数模块（M2 第二阶段）
// ============================================================================
// 移植自 temp/liuyao_proto.py（1:1 复刻源 h5-game/scripts/liuyao.lua）：
//   - 摇卦：6 次三铜钱（老阳○/老阴×/少阳/少阴）；生产随机源 = Math.random()<0.5，
//     测试可注入确定性 rng 以与 Python 原型（random.Random(seed)）逐项对照
//   - 月建：节气月建（立春建寅…，lunar.ts getMonthGz 口径）——M2 第二阶段新口径
//   - 用神取数：15 项完整事项→用神规则表（源 YONGSHEN_POOL 5 项 + 主流取法扩展）
//   - 装卦 / 断卦 / 出签 1:1 对齐源 liuyao.lua
// ============================================================================
import { lunarToSolar, solarToLunarInfo, DI_ZHI, TIAN_GAN } from './lunar.ts'

// ==================== 基础数据（与源 1:1） ====================
export const BAGUA: Record<string, number[]> = {
  '乾': [1, 1, 1], '兑': [1, 1, 0], '离': [1, 0, 1], '震': [1, 0, 0],
  '巽': [0, 1, 1], '坎': [0, 1, 0], '艮': [0, 0, 1], '坤': [0, 0, 0],
}
const BAGUA_CODE: Record<string, string> = {}
for (const name of Object.keys(BAGUA)) BAGUA_CODE[BAGUA[name].join('')] = name

export const GUA_NAME: Record<string, string> = {
  '乾乾': '乾为天', '乾兑': '泽天夬', '乾离': '火天大有', '乾震': '雷天大壮',
  '乾巽': '风天小畜', '乾坎': '水天需', '乾艮': '山天大畜', '乾坤': '地天泰',
  '兑乾': '天泽履', '兑兑': '兑为泽', '兑离': '火泽睽', '兑震': '雷泽归妹',
  '兑巽': '风泽中孚', '兑坎': '水泽节', '兑艮': '山泽损', '兑坤': '地泽临',
  '离乾': '天火同人', '离兑': '泽火革', '离离': '离为火', '离震': '雷火丰',
  '离巽': '风火家人', '离坎': '水火既济', '离艮': '山火贲', '离坤': '地火明夷',
  '震乾': '天雷无妄', '震兑': '泽雷随', '震离': '火雷噬嗑', '震震': '震为雷',
  '震巽': '风雷益', '震坎': '水雷屯', '震艮': '山雷颐', '震坤': '地雷复',
  '巽乾': '天风姤', '巽兑': '泽风大过', '巽离': '火风鼎', '巽震': '雷风恒',
  '巽巽': '巽为风', '巽坎': '水风井', '巽艮': '山风蛊', '巽坤': '地风升',
  '坎乾': '天水讼', '坎兑': '泽水困', '坎离': '火水未济', '坎震': '雷水解',
  '坎巽': '风水涣', '坎坎': '坎为水', '坎艮': '山水蒙', '坎坤': '地水师',
  '艮乾': '天山遁', '艮兑': '泽山咸', '艮离': '火山旅', '艮震': '雷山小过',
  '艮巽': '风山渐', '艮坎': '水山蹇', '艮艮': '艮为山', '艮坤': '地山谦',
  '坤乾': '天地否', '坤兑': '泽地萃', '坤离': '火地晋', '坤震': '雷地豫',
  '坤巽': '风地观', '坤坎': '水地比', '坤艮': '山地剥', '坤坤': '坤为地',
}

export const NAJIA_BY_GUA: Record<string, { inner: string[]; outer: string[] }> = {
  '乾': { inner: ['子', '寅', '辰'], outer: ['午', '申', '戌'] },
  '坤': { inner: ['未', '巳', '卯'], outer: ['丑', '亥', '酉'] },
  '震': { inner: ['子', '寅', '辰'], outer: ['午', '申', '戌'] },
  '巽': { inner: ['丑', '亥', '酉'], outer: ['未', '巳', '卯'] },
  '坎': { inner: ['寅', '辰', '午'], outer: ['申', '戌', '子'] },
  '离': { inner: ['卯', '丑', '亥'], outer: ['酉', '未', '巳'] },
  '艮': { inner: ['辰', '午', '申'], outer: ['戌', '子', '寅'] },
  '兑': { inner: ['巳', '卯', '丑'], outer: ['亥', '酉', '未'] },
}
export const GONG_ELEMENT: Record<string, string> = { '乾': '金', '坎': '水', '艮': '土', '震': '木', '巽': '木', '离': '火', '坤': '土', '兑': '金' }
export const ZHI_WUXING: Record<string, string> = { '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水' }
export const SHENG: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' }
export const KE: Record<string, string> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' }
export const LIU_CHONG: Record<string, string> = { '子': '午', '丑': '未', '寅': '申', '卯': '酉', '辰': '戌', '巳': '亥', '午': '子', '未': '丑', '申': '寅', '酉': '卯', '戌': '辰', '亥': '巳' }

export const LIUSHEN_START: Record<string, string> = {
  '甲': '青龙', '乙': '青龙', '丙': '朱雀', '丁': '朱雀', '戊': '勾陈',
  '己': '腾蛇', '庚': '白虎', '辛': '白虎', '壬': '玄武', '癸': '玄武',
}
export const LIUSHEN_ORDER = ['青龙', '朱雀', '勾陈', '腾蛇', '白虎', '玄武']

export const SHI_POS: Record<number, number> = { 0: 5, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 3, 7: 2 }

// ==================== 八宫定位（与源 1:1） ====================
function flip(bits: number[], idx: number): number[] {
  const b = bits.slice()
  b[idx] = 1 - b[idx]
  return b
}

function buildGong(gongBits: number[]): number[][] {
  const seq: number[][] = [gongBits.slice()]
  let cur = gongBits.slice()
  for (let i = 1; i <= 5; i++) {          // 一世..五世（0-based flip 0..4）
    cur = flip(cur, i - 1)
    seq.push(cur)
  }
  let youhun = flip(seq[5], 3)            // 五世再变第四爻（0-based 3）
  seq.push(youhun)
  let guihun = flip(youhun, 0)
  guihun = flip(guihun, 1)
  guihun = flip(guihun, 2)
  seq.push(guihun)
  return seq
}

const GONG_BEN: Record<string, number[]> = {}
for (const gong of Object.keys(BAGUA)) GONG_BEN[gong] = BAGUA[gong].concat(BAGUA[gong])

const GONG_INDEX: Record<string, [string, number]> = {}
for (const gong of Object.keys(GONG_BEN)) {
  const seq = buildGong(GONG_BEN[gong])
  for (let i = 0; i < seq.length; i++) GONG_INDEX[seq[i].join('')] = [gong, i] // i: 0=本宫...5=五世,6=游魂,7=归魂
}

// ==================== 旬空（与源 1:1） ====================
export function xunKong(dayIdx: number): string[] {
  const start = dayIdx - (dayIdx % 10)
  const used: boolean[] = []
  for (let i = start; i < start + 10; i++) used[(i % 12 + 12) % 12] = true
  const kong: string[] = []
  for (let i = 0; i < 12; i++) if (!used[i]) kong.push(DI_ZHI[i])
  return kong
}

// ==================== 摇卦（源 1:1；生产 Math.random，测试可注入 rng） ====================
// rng() 约定返回 0/1 位：生产默认 Math.random()<0.5；测试注入 PyRandom.randint01()
// （CPython random.Random(seed).randint(0,1)=getrandbits(1) 最高位）——与 Python 原型逐位一致
export function castHexagram(rng: () => number = (): number => (Math.random() < 0.5 ? 1 : 0)): { ben: number[]; bian: number[]; moving: number[] } {
  const ben = [0, 0, 0, 0, 0, 0]
  const bian = [0, 0, 0, 0, 0, 0]
  const moving: number[] = []
  for (let i = 0; i < 6; i++) {
    const heads = rng() + rng() + rng()
    if (heads === 3) {            // 老阳 ○ 动
      ben[i] = 1; bian[i] = 0; moving.push(i)
    } else if (heads === 0) {     // 老阴 × 动
      ben[i] = 0; bian[i] = 1; moving.push(i)
    } else if (heads === 2) {     // 少阳
      ben[i] = bian[i] = 1
    } else {                      // 少阴
      ben[i] = bian[i] = 0
    }
  }
  return { ben, bian, moving }
}

// ==================== 装卦（源 1:1） ====================
export interface ZhuangResult {
  gong: string
  seq: number
  element: string
  dizhi: string[]
  wuxing: string[]
  liuqin: string[]
  shi: number
  ying: number
  liuShen: string[]
}

export function zhuangGua(ben: number[], dayGan: string): ZhuangResult {
  const entry = GONG_INDEX[ben.join('')]
  const gong = entry[0]
  const seq = entry[1]
  const xGua = BAGUA_CODE[ben.slice(0, 3).join('')]
  const sGua = BAGUA_CODE[ben.slice(3, 6).join('')]
  const dizhi = NAJIA_BY_GUA[xGua].inner.concat(NAJIA_BY_GUA[sGua].outer)
  const element = GONG_ELEMENT[gong]
  const wuxing = dizhi.map((z) => ZHI_WUXING[z])
  const liuqin: string[] = []
  for (let i = 0; i < 6; i++) {
    const wx = wuxing[i]
    if (wx === element) liuqin.push('兄弟')
    else if (SHENG[wx] === element) liuqin.push('父母')
    else if (SHENG[element] === wx) liuqin.push('子孙')
    else if (KE[wx] === element) liuqin.push('官鬼')
    else liuqin.push('妻财')
  }
  const shi = SHI_POS[seq]
  const ying = (shi + 3) % 6
  const lsIdx = LIUSHEN_ORDER.indexOf(LIUSHEN_START[dayGan])
  const liuShen: string[] = []
  for (let i = 0; i < 6; i++) liuShen.push(LIUSHEN_ORDER[(lsIdx + i) % 6])
  return { gong, seq, element, dizhi, wuxing, liuqin, shi, ying, liuShen }
}

// ==================== 完整事项→用神规则表（源 5 项 + 主流取法修正扩展） ====================
export interface YongshenRule {
  name: string
  short: string
  liuqin: string | null
  pos: 'ying' | 'shi' | null
  good: string
  bad: string
  source: string
}

export const YONGSHEN_RULES: YongshenRule[] = [
  { name: '财运', short: '财', liuqin: '妻财', pos: null, good: '正财偏财皆可期', bad: '宜守不宜进', source: '源 liuyao.lua YONGSHEN_POOL（财运=妻财）；主流《增删卜易》求财以妻财为用神' },
  { name: '事业', short: '事业', liuqin: '官鬼', pos: null, good: '谋事可成，晋升有望', bad: '宜稳扎稳打', source: '源 liuyao.lua YONGSHEN_POOL（事业=官鬼）；主流占官运/求职以官鬼为用' },
  { name: '学业', short: '学业', liuqin: '父母', pos: null, good: '文书得力，考试有望', bad: '需加倍用心', source: '源 liuyao.lua YONGSHEN_POOL（学业=父母）；主流占学业以父母（文书印绶）为用' },
  { name: '人缘', short: '人缘', liuqin: '兄弟', pos: null, good: '贵人相助，人缘渐旺', bad: '宜独善其身', source: '源 liuyao.lua YONGSHEN_POOL（人缘=兄弟）；主流占同辈/朋友以兄弟为用' },
  { name: '平安', short: '平安', liuqin: '子孙', pos: null, good: '福神护佑，平安顺遂', bad: '宜多留意', source: '源 liuyao.lua YONGSHEN_POOL（平安=子孙）；主流占平安以子孙为福神' },
  { name: '考试', short: '考试', liuqin: '父母', pos: null, good: '临场发挥佳，文星得力', bad: '需查漏补缺', source: '主流《增删卜易》占考试以父母（文书/印绶）为用神' },
  { name: '疾病（自占）', short: '病', liuqin: '官鬼', pos: null, good: '病根渐去，逢冲得愈', bad: '宜遵医嘱静养', source: '主流占疾病以官鬼为病神（自身病以官鬼为用，见《增删卜易》疾病章）' },
  { name: '疾病（占长辈）', short: '亲病', liuqin: '父母', pos: null, good: '长辈逢生扶，渐趋康复', bad: '宜悉心照料', source: '主流占父母长辈病以父母爻为用神' },
  { name: '失物', short: '失物', liuqin: '妻财', pos: null, good: '财爻不失，寻之可得', bad: '财爻受伤，恐难寻回', source: '主流《增删卜易》寻失物以妻财为用神（失物为财）' },
  { name: '合作', short: '合作', liuqin: null, pos: 'ying', good: '应爻生世，合作可成', bad: '应爻克世，合作有阻', source: '主流占合作/合伙以应爻为对方（世我应彼）' },
  { name: '婚姻（男占）', short: '姻缘', liuqin: '妻财', pos: null, good: '妻财得位，良缘可期', bad: '妻财空破，缘分尚浅', source: '主流男占婚以妻财为妻星为用神' },
  { name: '婚姻（女占）', short: '姻缘', liuqin: '官鬼', pos: null, good: '官鬼得位，佳偶天成', bad: '官鬼空破，姻缘待时', source: '主流女占婚以官鬼为夫星为用神' },
  { name: '出行', short: '出行', liuqin: '子孙', pos: null, good: '福神临身，出行顺利', bad: '福神受伤，宜缓行程', source: '主流占出行以子孙为福神（避凶之神）；亦有取世爻者，此处取通行子孙法' },
  { name: '诉讼', short: '讼', liuqin: '官鬼', pos: null, good: '官鬼有制，理直可胜', bad: '官鬼旺相，讼事缠身', source: '主流占官讼以官鬼为官非/对簿之象' },
  { name: '田宅', short: '家宅', liuqin: '父母', pos: null, good: '父母得力，家宅安稳', bad: '父母受克，宅运有扰', source: '主流占房屋田宅以父母为宅（庇荫之所）' },
]

export function getYongshenRule(questionType: string): YongshenRule {
  const q = (questionType || '').trim()
  for (const r of YONGSHEN_RULES) if (r.name === q) return r
  const alias: Record<string, string> = {
    '婚姻': '婚姻（男占）', '婚恋': '婚姻（男占）', '爱情': '婚姻（男占）',
    '健康': '疾病（自占）', '疾病': '疾病（自占）', '病': '疾病（自占）',
    '寻物': '失物', '找东西': '失物', '合伙': '合作', '谈判': '合作',
    '工作': '事业', '求职': '事业', '面试': '事业',
    '出行': '出行', '旅游': '出行', '房屋': '田宅', '买房': '田宅',
    '考试': '考试', '成绩': '考试', '官司': '诉讼',
  }
  if (alias[q]) {
    const q2 = alias[q]
    for (const r of YONGSHEN_RULES) if (r.name === q2) return r
  }
  for (const key of ['财运', '事业', '学业', '人缘', '平安', '考试', '疾病', '失物', '合作', '婚姻', '出行', '诉讼', '田宅']) {
    const hit = YONGSHEN_RULES.find((r) => r.name.includes(key))
    if (hit) return hit
  }
  return YONGSHEN_RULES[0]
}

// ==================== 断卦（源 1:1，用神改为规则取数） ====================
export interface DuanDetail {
  pos: number
  zhi: string
  wx: string
  notes: string[]
}
export interface DuanResult {
  ysPos: number[]
  detail: DuanDetail[]
  dongNotes: string[]
  shiLiuqin: string
  verdict: string
  brief: string
}

export function duanGuashi(
  ben: number[], bian: number[], moving: number[],
  zhuang: ZhuangResult, yongshen: YongshenRule,
  dayZhi: string, monthZhi: string, kong: string[],
): DuanResult {
  const shi = zhuang.shi
  const ysPos: number[] = []
  if (yongshen.pos === 'ying') ysPos.push(zhuang.ying)
  else if (yongshen.pos === 'shi') ysPos.push(zhuang.shi)
  else {
    for (let i = 0; i < 6; i++) if (zhuang.liuqin[i] === yongshen.liuqin) ysPos.push(i)
  }
  const detail: DuanDetail[] = []
  for (const p of ysPos) {
    const z = zhuang.dizhi[p]
    const wx = zhuang.wuxing[p]
    const notes: string[] = []
    const mWx = ZHI_WUXING[monthZhi]
    const dWx = ZHI_WUXING[dayZhi]
    if (SHENG[mWx] === wx || SHENG[dWx] === wx) notes.push('得月建/日辰生扶')
    if (KE[mWx] === wx || KE[dWx] === wx) notes.push('受月建/日辰克')
    if (kong[0] === z || kong[1] === z) notes.push('旬空')
    if (p === shi) notes.push('持世')
    for (const m of moving) {
      if (m === p) { notes.push('动'); break }
    }
    detail.push({ pos: p, zhi: z, wx: wx, notes })
  }
  const dongNotes: string[] = []
  for (const m of moving) {
    const wx = zhuang.wuxing[m]
    const shengHit = detail.some((d) => SHENG[wx] === d.wx)
    const keHit = detail.some((d) => KE[wx] === d.wx)
    if (shengHit || keHit) {
      const acts: string[] = []
      if (shengHit) acts.push('生')
      if (keHit) acts.push('克')
      dongNotes.push(`第${m + 1}爻(${zhuang.dizhi[m]})动而${acts.join('、')}${yongshen.short}`)
    }
  }
  let verdict: string
  let brief: string
  if (ysPos.length === 0) {
    verdict = '凶'
    brief = `卦中无${yongshen.liuqin}之爻，${yongshen.name}难聚，宜守待时。`
  } else {
    let strong = false
    let held = false
    let empty = false
    for (const d of detail) {
      const hasBorn = d.notes.some((n) => n.includes('生扶'))
      const hasKe = d.notes.some((n) => n.includes('受') && n.includes('克'))
      if (hasBorn && !hasKe) strong = true
      if (d.notes.join(' ').includes('持世')) held = true
      if (d.notes.join(' ').includes('旬空')) empty = true
    }
    if (held) { verdict = '吉'; brief = yongshen.good }
    else if (strong && !empty) { verdict = '吉'; brief = yongshen.good }
    else if (empty) { verdict = '平'; brief = '用神旬空，待出空之日再图。' }
    else { verdict = '平'; brief = yongshen.bad }
  }
  return { ysPos, detail, dongNotes, shiLiuqin: zhuang.liuqin[shi], verdict, brief }
}

// ==================== 出签文案（源 1:1） ====================
function guaName(bits: number[]): string {
  const x = BAGUA_CODE[bits.slice(0, 3).join('')]
  const s = BAGUA_CODE[bits.slice(3, 6).join('')]
  return GUA_NAME[x + s]
}

export interface PanCell {
  shen: string
  dz: string
  qin: string
  mark: string
}
export interface SigningResult {
  title: string
  panCells: PanCell[]
  lines: string[]
  yingQi: string
}

const SHOW_TAIL: Record<string, string> = {
  '财运': '财机显现', '事业': '事业可期', '学业': '学业可期',
  '人缘': '人缘渐旺', '平安': '平安可期',
}

export function makeSigning(
  ben: number[], bian: number[], moving: number[],
  zhuang: ZhuangResult, duan: DuanResult, yongshen: YongshenRule,
  dayZhi: string, monthZhi: string, kong: string[],
): SigningResult {
  const gName = guaName(ben)
  const bName = moving.length ? guaName(bian) : null
  const title = moving.length ? `${gName} 之 ${bName}` : gName

  const panCells: PanCell[] = []
  for (let i = 5; i >= 0; i--) {
    let mark = ''
    for (const m of moving) {
      if (m === i) { mark = ben[i] === 1 ? '○' : '×'; break }
    }
    let shiYing = ''
    if (i === zhuang.shi) shiYing = '世'
    else if (i === zhuang.ying) shiYing = '应'
    panCells.push({
      shen: zhuang.liuShen[i] + shiYing,
      dz: zhuang.dizhi[i] + zhuang.wuxing[i],
      qin: zhuang.liuqin[i],
      mark,
    })
  }

  const lines: string[] = []
  lines.push('【卦象】' + title)
  lines.push('【占问】' + yongshen.name)
  lines.push('【用神】' + (yongshen.liuqin ? yongshen.liuqin + '爻' : (yongshen.pos === 'ying' ? '应爻' : '世爻')))
  if (moving.length) {
    if (duan.dongNotes.length) lines.push('【动爻】' + duan.dongNotes.join('；'))
    else {
      const parts = moving.map((m) => `第${m + 1}爻(${zhuang.dizhi[m]})动`)
      lines.push('【动爻】' + parts.join('、'))
    }
  } else {
    lines.push('【动爻】无')
  }
  lines.push('【断语】' + duan.verdict + '：' + duan.brief)
  let yingQi: string
  if (duan.ysPos.length) {
    const d0 = duan.detail[0]
    const hasKong = d0.notes.some((n) => n.includes('旬空'))
    const tail = SHOW_TAIL[yongshen.name] || yongshen.name
    if (hasKong) yingQi = `逢${d0.zhi}出空之日，${tail}`
    else yingQi = `逢${d0.zhi}、${LIU_CHONG[d0.zhi]}之日，${tail}`
  } else {
    yingQi = `静待时机，勿强求${yongshen.name}`
  }
  lines.push('【应期】' + yingQi)
  return { title, panCells, lines, yingQi }
}

// ==================== 排盘（入参：农历/干支历） ====================
export interface LiuYaoResult {
  date: string
  ganzhi: string
  monthZhi: string
  kong: string[]
  question: string
  yongshen: YongshenRule
  yongshenRule: YongshenRule
  caseSolar: string
  gong: string
  element: string
  shi: number
  ying: number
  shiLiuqin: string
  moving: number[]
  ben: number[]
  bian: number[]
  title: string
  panCells: PanCell[]
  liuqin: string[]
  duan: { verdict: string; brief: string; detail: DuanDetail[]; dongNotes: string[] }
  lines: string[]
  yingQi: string
}

function pad2(n: number): string {
  return n < 10 ? '0' + n : String(n)
}

export function buildPaipan(
  lunarYear: number, lunarMonth: number, lunarDay: number,
  questionType = '财运', rng: () => number = Math.random,
): LiuYaoResult {
  const [sy, sm, sd] = lunarToSolar(lunarYear, lunarMonth, lunarDay)
  const conv = solarToLunarInfo(sy, sm, sd)
  const dayGz = conv.ganzhi.day
  const dayGan = dayGz[0]
  const dayZhi = dayGz[1]
  const dayIndex = conv.ganzhi.day_index
  const kong = xunKong(dayIndex)
  // 月建：节气月建（立春建寅…，lunar.ts getMonthGz 口径）——M2 第二阶段新口径
  const monthZhi = conv.ganzhi.month[1]
  const leap = conv.lunar.leap
  const dateStr = `农历${lunarYear}年${leap ? '闰' : ''}${pad2(Math.abs(lunarMonth))}月${pad2(lunarDay)}日（公历${sy}年${pad2(sm)}月${pad2(sd)}日）`

  const { ben, bian, moving } = castHexagram(rng)
  const zhuang = zhuangGua(ben, dayGan)
  const rule = getYongshenRule(questionType)
  const yongshen: YongshenRule = { ...rule }
  const duan = duanGuashi(ben, bian, moving, zhuang, yongshen, dayZhi, monthZhi, kong)
  const sign = makeSigning(ben, bian, moving, zhuang, duan, yongshen, dayZhi, monthZhi, kong)
  return {
    date: dateStr,
    ganzhi: dayGz + '日',
    monthZhi,
    kong,
    question: yongshen.name,
    yongshen,
    yongshenRule: yongshen,
    caseSolar: `${sy}-${pad2(sm)}-${pad2(sd)}`,
    gong: zhuang.gong,
    element: zhuang.element,
    shi: zhuang.shi,
    ying: zhuang.ying,
    shiLiuqin: duan.shiLiuqin,
    moving,
    ben,
    bian,
    title: sign.title,
    panCells: sign.panCells,
    liuqin: zhuang.liuqin,
    duan: { verdict: duan.verdict, brief: duan.brief, detail: duan.detail, dongNotes: duan.dongNotes },
    lines: sign.lines,
    yingQi: sign.yingQi,
  }
}
