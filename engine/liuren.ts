// ============================================================================
// engine/liuren.ts —— 大六壬起课（TS 纯函数模块，M2 第二阶段）
// ============================================================================
// 移植自 temp/liuren_proto.py（1:1 复刻源 h5-game/scripts/liuren.lua buildPaipan）：
//   - 入参：农历年/月（负数=闰月）/日 + 时辰（0-23）+ 占问类型
//   - 内部经 engine/lunar.ts 转公历并取干支历（年柱立春界、月柱节气月建、日柱源算法）
//   - 月将：精确中气时刻（M2 第二阶段新口径，替换源固定中气日期近似表）
//   - 四课 / 课体 / 三传 / 天将 / 神煞 / 断课 / 应期 / 专项 / lines / hints 全部 1:1
// ============================================================================
import {
  TIAN_GAN, DI_ZHI, JIA_ZI, solarToLunarInfo, lunarToSolar, getYuejiangExact,
} from './lunar.ts'

// ---------------- 基础数据（与源 1:1） ----------------
const ZHI_WUXING: Record<string, string> = { '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水' }
const GAN_WUXING: Record<string, string> = { '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水' }
const WUXING_SHENG: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' }
const WUXING_KE: Record<string, string> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' }
const GAN_JIGONG: Record<string, string> = { '甲': '寅', '乙': '辰', '丙': '巳', '丁': '未', '戊': '巳', '己': '未', '庚': '申', '辛': '戌', '壬': '亥', '癸': '丑' }
const YANG_GAN = new Set(['甲', '丙', '戊', '庚', '壬'])
const SAN_XING: Record<string, string> = { '寅': '巳', '巳': '申', '申': '寅', '丑': '戌', '戌': '未', '未': '丑', '子': '卯', '卯': '子', '辰': '辰', '午': '午', '酉': '酉', '亥': '亥' }
const LIU_CHONG: Record<string, string> = { '子': '午', '丑': '未', '寅': '申', '卯': '酉', '辰': '戌', '巳': '亥', '午': '子', '未': '丑', '申': '寅', '酉': '卯', '戌': '辰', '亥': '巳' }
const LIU_HE: Record<string, string> = { '子': '丑', '丑': '子', '寅': '亥', '亥': '寅', '卯': '戌', '戌': '卯', '辰': '酉', '酉': '辰', '巳': '申', '申': '巳', '午': '未', '未': '午' }
const LIU_HAI: Record<string, string> = { '子': '未', '丑': '午', '寅': '巳', '卯': '辰', '辰': '卯', '巳': '寅', '午': '丑', '未': '子', '申': '亥', '酉': '戌', '戌': '酉', '亥': '申' }
const SAN_HE_JU = [['申', '子', '辰'], ['亥', '卯', '未'], ['寅', '午', '戌'], ['巳', '酉', '丑']]
const TIAN_JIANG = ['贵人', '螣蛇', '朱雀', '六合', '勾陈', '青龙', '天空', '白虎', '太常', '玄武', '太阴', '天后']
const GUIREN_MAP: Record<string, [string, string]> = {
  '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'],
  '己': ['子', '申'], '乙': ['子', '申'],
  '丙': ['亥', '酉'], '丁': ['亥', '酉'],
  '癸': ['卯', '巳'], '壬': ['卯', '巳'],
  '辛': ['午', '寅'],
}
const HOUR_PAIRS: [number, string][] = [[0, '子'], [2, '丑'], [4, '寅'], [6, '卯'], [8, '辰'], [10, '巳'], [12, '午'], [14, '未'], [16, '申'], [18, '酉'], [20, '戌'], [22, '亥']]
const HOUR_TO_ZHI: Record<number, string> = {}
for (const [startHour, zhi] of HOUR_PAIRS) {
  for (let h = startHour; h < startHour + 2; h++) HOUR_TO_ZHI[h] = zhi
}
const LU_SHEN: Record<string, string> = { '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳', '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子' }
const WEN_CHANG: Record<string, string> = { '甲': '巳', '乙': '午', '丙': '申', '丁': '酉', '戊': '申', '己': '酉', '庚': '亥', '辛': '子', '壬': '寅', '癸': '卯' }
const YUE_DE: Record<string, string> = { '寅午戌': '丙', '亥卯未': '甲', '申子辰': '壬', '巳酉丑': '庚' }
const PO_SUI: Record<string, string> = { '寅': '酉', '卯': '午', '辰': '亥', '巳': '子', '午': '卯', '未': '午', '申': '丑', '酉': '卯', '戌': '未', '亥': '卯', '子': '酉', '丑': '辰' }
const GU_CHEN: Record<string, string> = { '亥': '寅', '子': '寅', '丑': '寅', '寅': '巳', '卯': '巳', '辰': '巳', '巳': '申', '午': '申', '未': '申', '申': '亥', '酉': '亥', '戌': '亥' }
const GUA_SU: Record<string, string> = { '亥': '戌', '子': '戌', '丑': '戌', '寅': '丑', '卯': '丑', '辰': '丑', '巳': '辰', '午': '辰', '未': '辰', '申': '未', '酉': '未', '戌': '未' }
const GAN_HE_ZHI: Record<string, string> = { '甲': '未', '乙': '申', '丙': '戌', '丁': '亥', '戊': '丑', '己': '寅', '庚': '辰', '辛': '巳', '壬': '未', '癸': '巳' }
const WANG_XIANG_SI_JI: Record<string, Record<string, string>> = {
  '寅': { '木': '旺', '火': '相', '土': '休', '金': '囚', '水': '死' },
  '卯': { '木': '旺', '火': '相', '土': '休', '金': '囚', '水': '死' },
  '巳': { '火': '旺', '土': '相', '金': '休', '水': '囚', '木': '死' },
  '午': { '火': '旺', '土': '相', '金': '休', '水': '囚', '木': '死' },
  '申': { '金': '旺', '水': '相', '木': '休', '火': '囚', '土': '死' },
  '酉': { '金': '旺', '水': '相', '木': '休', '火': '囚', '土': '死' },
  '亥': { '水': '旺', '木': '相', '火': '休', '土': '囚', '金': '死' },
  '子': { '水': '旺', '木': '相', '火': '休', '土': '囚', '金': '死' },
  '辰': { '土': '旺', '金': '相', '水': '休', '木': '囚', '火': '死' },
  '戌': { '土': '旺', '金': '相', '水': '休', '木': '囚', '火': '死' },
  '丑': { '土': '旺', '金': '相', '水': '休', '木': '囚', '火': '死' },
  '未': { '土': '旺', '金': '相', '水': '休', '木': '囚', '火': '死' },
}
const KONG_WANG: Record<number, [string, string]> = {}
for (let xun = 0; xun < 60; xun += 10) {
  const zhi = JIA_ZI[xun][1]
  const zi = DI_ZHI.indexOf(zhi)
  KONG_WANG[xun] = [DI_ZHI[(zi + 10) % 12], DI_ZHI[(zi + 11) % 12]]
  for (let idx = xun + 1; idx < xun + 10; idx++) KONG_WANG[idx] = KONG_WANG[xun]
}
const YI_MA: Record<string, string> = { '寅': '申', '午': '申', '戌': '申', '申': '寅', '子': '寅', '辰': '寅', '巳': '亥', '酉': '亥', '丑': '亥', '亥': '巳', '卯': '巳', '未': '巳' }
const TAO_HUA: Record<string, string> = { '寅': '卯', '午': '卯', '戌': '卯', '申': '酉', '子': '酉', '辰': '酉', '巳': '午', '酉': '午', '丑': '午', '亥': '子', '卯': '子', '未': '子' }
const JIE_SHA: Record<string, string> = { '寅': '亥', '午': '亥', '戌': '亥', '申': '巳', '子': '巳', '辰': '巳', '巳': '寅', '酉': '寅', '丑': '寅', '亥': '申', '卯': '申', '未': '申' }
const HUA_GAI: Record<string, string> = { '寅': '戌', '午': '戌', '戌': '戌', '申': '辰', '子': '辰', '辰': '辰', '巳': '丑', '酉': '丑', '丑': '丑', '亥': '未', '卯': '未', '未': '未' }
const JIANG_XING: Record<string, string> = { '寅': '午', '午': '午', '戌': '午', '申': '子', '子': '子', '辰': '子', '巳': '酉', '酉': '酉', '丑': '酉', '亥': '卯', '卯': '卯', '未': '卯' }

// ---------------- 工具函数（1:1） ----------------
function zhiIdx(z: string): number {
  return DI_ZHI.indexOf(z)
}
function wuxingKe(a: string, b: string): boolean {
  return WUXING_KE[a] === b
}
function wuxingSheng(a: string, b: string): boolean {
  return WUXING_SHENG[a] === b
}
function sanheJu(z: string): string[] | null {
  for (const ju of SAN_HE_JU) {
    if (ju.includes(z)) return ju
  }
  return null
}

// ---------------- 排盘 ----------------
export function buildPaipan(
  lunarYear: number, lunarMonth: number, lunarDay: number, hour: number,
  questionType = '灵犀一念',
): any {
  const [sy, sm, sd] = lunarToSolar(lunarYear, lunarMonth, lunarDay)
  const conv = solarToLunarInfo(sy, sm, sd)
  const gz = conv.ganzhi
  const leap = conv.lunar.leap
  const dateStr = `农历${lunarYear}年${leap ? '闰' : ''}${String(Math.abs(lunarMonth)).padStart(2, '0')}月${String(lunarDay).padStart(2, '0')}日 ${hour}时（公历${sy}年${String(sm).padStart(2, '0')}月${String(sd).padStart(2, '0')}日）`
  const yearGz = gz.year_solar
  const monthGz = gz.month
  const dayGz = gz.day
  const dayIndex = gz.day_index
  const riGan = dayGz[0]
  const riZhi = dayGz[1]

  const jieqi = getYuejiangExact(sy, sm, sd, hour, 0)
  const zhanShi = HOUR_TO_ZHI[hour] ?? '子'

  // 天地盘：月将加时
  const yjIdx = zhiIdx(jieqi.zhi)
  const zsIdx = zhiIdx(zhanShi)
  const tianpan: string[] = []
  for (let i = 1; i <= 12; i++) {
    tianpan.push(DI_ZHI[((((yjIdx - zsIdx + i - 1) % 12) + 12) % 12)])
  }

  const dipanShang = (dz: string): string => tianpan[zhiIdx(dz)]

  const jigong = GAN_JIGONG[riGan]
  const ke1Shang = dipanShang(jigong)
  const ke2Shang = dipanShang(ke1Shang)
  const ke3Shang = dipanShang(riZhi)
  const ke4Shang = dipanShang(ke3Shang)
  const siKe: [string, string][] = [
    [jigong, ke1Shang],
    [ke1Shang, ke2Shang],
    [riZhi, ke3Shang],
    [ke3Shang, ke4Shang],
  ]

  // 课体检测
  let keTiType = 'normal'
  const fuyin = tianpan.every((v, i) => v === DI_ZHI[i])
  const fanyin = tianpan.every((v, i) => v === LIU_CHONG[DI_ZHI[i]])
  const bazhuan = ke1Shang === ke3Shang
  const keys = new Set(siKe.map(k => k[0] + k[1]))
  const uniqueN = keys.size
  const bieze = uniqueN <= 2 && !bazhuan
  if (fuyin) keTiType = 'fuyin'
  else if (fanyin) keTiType = 'fanyin'
  else if (bazhuan) keTiType = 'bazhuan'
  else if (bieze) keTiType = 'bieze'

  function zhiKeGan(shang: string, xia: string): string | null {
    const ws = ZHI_WUXING[shang]
    const wx = ZHI_WUXING[xia]
    if (wuxingKe(ws, wx)) return '上克下'
    if (wuxingKe(wx, ws)) return '下克上'
    return null
  }

  let chuChuan: string | null = null
  let zhongChuan: string | null = null
  let moChuan: string | null = null
  let keTi = ''

  const sanchuanFollow = (primary: number[]) => {
    const i = primary[0]
    chuChuan = siKe[i][1]
    zhongChuan = tianpan[zhiIdx(chuChuan)]
    moChuan = tianpan[zhiIdx(zhongChuan)]
  }

  if (keTiType === 'fuyin') {
    keTi = '伏吟课（自任/自信）'
    if (YANG_GAN.has(riGan)) {
      chuChuan = ke1Shang
      keTi += '（刚日自任）'
    } else {
      chuChuan = ke3Shang
      keTi += '（柔日自信）'
    }
    zhongChuan = SAN_XING[chuChuan] || chuChuan
    moChuan = SAN_XING[zhongChuan] || zhongChuan
  } else if (keTiType === 'fanyin') {
    keTi = '反吟课'
    const shangKe: number[] = []
    const xiaKe: number[] = []
    for (let i = 0; i < 4; i++) {
      const r = zhiKeGan(siKe[i][1], siKe[i][0])
      if (r === '上克下') shangKe.push(i)
      else if (r === '下克上') xiaKe.push(i)
    }
    if (shangKe.length || xiaKe.length) {
      keTi += '（有克）'
      const allIdx = xiaKe.concat(shangKe)
      chuChuan = siKe[allIdx[0]][1]
    } else {
      keTi += '（无克，驿马发用）'
      chuChuan = YI_MA[riZhi] || riZhi
    }
    zhongChuan = tianpan[zhiIdx(chuChuan)]
    moChuan = tianpan[zhiIdx(zhongChuan)]
  } else if (keTiType === 'bazhuan') {
    keTi = '八专课'
    if (YANG_GAN.has(riGan)) {
      chuChuan = DI_ZHI[(zhiIdx(ke1Shang) + 1) % 12]
    } else {
      chuChuan = DI_ZHI[(((zhiIdx(ke3Shang) - 3) % 12) + 12) % 12]
    }
    zhongChuan = ke1Shang
    moChuan = ke3Shang
  } else if (keTiType === 'bieze') {
    keTi = '别责课'
    const heZhi = YANG_GAN.has(riGan) ? GAN_HE_ZHI[riGan] : LIU_HE[riZhi]
    chuChuan = tianpan[zhiIdx(heZhi)]
    zhongChuan = ke1Shang
    moChuan = ke3Shang
  } else {
    const shangKeXia: number[] = []
    const xiaKeShang: number[] = []
    for (let i = 0; i < 4; i++) {
      const r = zhiKeGan(siKe[i][1], siKe[i][0])
      if (r === '上克下') shangKeXia.push(i)
      else if (r === '下克上') xiaKeShang.push(i)
    }
    const judgeVariant = (primary: number[], secondary: number[], ktype: string): string => {
      if (primary.length === 1) {
        if (ktype === '贼') return '重审课'
        return '元首课'
      }
      if (primary.length + secondary.length > 1) return '知一课（比用）'
      return '元首课'
    }
    if (xiaKeShang.length) {
      keTi = judgeVariant(xiaKeShang, shangKeXia, '贼')
      sanchuanFollow(xiaKeShang.concat(shangKeXia))
    } else if (shangKeXia.length) {
      keTi = judgeVariant(shangKeXia, [], '克')
      sanchuanFollow(shangKeXia)
    } else {
      const riWx = GAN_WUXING[riGan]
      let yaoIdx: number | null = null
      let yaoType: string | null = null
      for (let i = 0; i < 4; i++) {
        const swx = ZHI_WUXING[siKe[i][1]]
        if (wuxingKe(riWx, swx)) { yaoIdx = i; yaoType = '干克神'; break }
        else if (wuxingKe(swx, riWx)) { yaoIdx = i; yaoType = '神克干'; break }
      }
      if (yaoIdx !== null) {
        keTi = '遥克课'
        chuChuan = siKe[yaoIdx][1]
        zhongChuan = tianpan[zhiIdx(chuChuan)]
        moChuan = tianpan[zhiIdx(zhongChuan)]
      } else {
        keTi = '昴星课（无遥克）'
        if (YANG_GAN.has(riGan)) {
          chuChuan = dipanShang('酉')
        } else {
          let diZhi = ke4Shang
          for (let i = 0; i < 12; i++) {
            if (tianpan[i] === '酉') { diZhi = DI_ZHI[i]; break }
          }
          chuChuan = diZhi
        }
        zhongChuan = tianpan[zhiIdx(chuChuan)]
        moChuan = tianpan[zhiIdx(zhongChuan)]
      }
    }
  }

  // 天将
  const isDaytime = 5 <= hour && hour < 17
  const gr = GUIREN_MAP[riGan] || ['丑', '未']
  const guirenZhi = isDaytime ? gr[0] : gr[1]
  const grIdx = zhiIdx(guirenZhi)
  const shunni = 6 <= grIdx && grIdx <= 10 ? '逆' : '顺'
  let guirenTpPos = -1
  for (let i = 0; i < 12; i++) {
    if (tianpan[i] === guirenZhi) { guirenTpPos = i; break }
  }
  if (guirenTpPos === -1) guirenTpPos = grIdx
  const direction = shunni === '逆' ? -1 : 1
  const tianJiangPositions: Record<number, string> = {}
  for (let i = 0; i < 12; i++) {
    const pos = (((guirenTpPos + direction * i) % 12) + 12) % 12
    tianJiangPositions[pos] = TIAN_JIANG[i]
  }
  const jiangAtZhi = (z: string): string => {
    for (let i = 0; i < 12; i++) {
      if (tianpan[i] === z) return tianJiangPositions[i] || ''
    }
    return ''
  }
  const chuJiang = jiangAtZhi(chuChuan)
  const zhongJiang = jiangAtZhi(zhongChuan)
  const moJiang = jiangAtZhi(moChuan)

  // 神煞
  const kong = KONG_WANG[dayIndex] || ['戌', '亥']
  const shenSha: Record<string, string> = {
    '驿马': YI_MA[riZhi] || '未知', '桃花': TAO_HUA[riZhi] || '未知',
    '劫煞': JIE_SHA[riZhi] || '未知', '华盖': HUA_GAI[riZhi] || '未知',
    '将星': JIANG_XING[riZhi] || '未知',
    '贵人': gr[0] + '、' + gr[1],
    '日德': LU_SHEN[riGan] || '未知', '禄神': LU_SHEN[riGan] || '未知',
    '文昌': WEN_CHANG[riGan] || '未知',
    '空亡': kong[0] + '、' + kong[1],
    '破碎': PO_SUI[zhanShi] || '未知',
    '孤辰': GU_CHEN[riZhi] || '未知', '寡宿': GUA_SU[riZhi] || '未知',
  }
  for (const key of Object.keys(YUE_DE)) {
    const ju = sanheJu(riZhi)
    if (ju && ju.includes(riZhi)) { shenSha['月德'] = YUE_DE[key]; break }
  }
  if (!shenSha['月德']) shenSha['月德'] = '未知'

  // 刑冲合害
  const xingChong: string[] = []
  for (const [label, z] of [['初传', chuChuan], ['中传', zhongChuan], ['末传', moChuan]] as [string, string][]) {
    const rels: string[] = []
    if (SAN_XING[z] === riZhi || SAN_XING[riZhi] === z) rels.push('刑日支' + riZhi)
    if (z === SAN_XING[z]) rels.push('自刑')
    if (LIU_CHONG[z] === riZhi) rels.push('冲日支' + riZhi)
    if (LIU_HE[z] === riZhi) rels.push('合日支' + riZhi)
    if (LIU_HAI[z] === riZhi) rels.push('害日支' + riZhi)
    const ju = sanheJu(z)
    if (ju && ju.includes(riZhi)) rels.push('与日支' + riZhi + '三合')
    if (rels.length) xingChong.push(label + z + '：' + rels.join('、'))
  }
  for (const [a, b, name] of [[chuChuan, zhongChuan, '初→中'], [zhongChuan, moChuan, '中→末'], [chuChuan, moChuan, '初→末']] as [string, string, string][]) {
    const rels: string[] = []
    if (SAN_XING[a] === b) rels.push(a + '刑' + b)
    if (LIU_CHONG[a] === b) rels.push(a + '冲' + b)
    if (LIU_HE[a] === b) rels.push(a + '合' + b)
    if (LIU_HAI[a] === b) rels.push(a + '害' + b)
    if (rels.length) xingChong.push(name + '：' + rels.join('、'))
  }
  if (!xingChong.length) xingChong.push('三传与日干支无明显刑冲合害。')

  // 五行分析
  const chuWx = ZHI_WUXING[chuChuan]
  const zhongWx = ZHI_WUXING[zhongChuan]
  const moWx = ZHI_WUXING[moChuan]
  const wuxingFenxi = ['初传' + chuChuan + '属' + chuWx, '中传' + zhongChuan + '属' + zhongWx, '末传' + moChuan + '属' + moWx]
  const chainParts: string[] = []
  if (wuxingSheng(chuWx, zhongWx)) chainParts.push('初生中')
  else if (wuxingKe(chuWx, zhongWx)) chainParts.push('初克中')
  else if (chuWx === zhongWx) chainParts.push('初同比和')
  if (wuxingSheng(zhongWx, moWx)) chainParts.push('中生末')
  else if (wuxingKe(zhongWx, moWx)) chainParts.push('中克末')
  else if (zhongWx === moWx) chainParts.push('中末比和')
  if (chainParts.length === 2) wuxingFenxi.push('传导：' + chainParts[0] + ' → ' + chainParts[1])
  const wc: Record<string, number> = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 }
  for (const wx of [chuWx, zhongWx, moWx]) wc[wx] += 1
  let domWx = '金', domN = 0
  for (const k of Object.keys(wc)) {
    if (wc[k] > domN) { domWx = k; domN = wc[k] }
  }
  wuxingFenxi.push('三传' + domWx + '气较旺')
  const wuxingText = wuxingFenxi.join('；') + '。'

  // 断课
  const keTiDescMap: Record<string, string> = {
    '元首课': '一上克下，尊制卑、顺为正。事主顺遂，但需防刚愎自用。',
    '重审课': '一下克上，卑犯尊、逆而争。事有反复，再三思量为宜。',
    '知一课（比用）': '多课有克，比用取传。事有选择，需从同类中权衡利弊。',
    '遥克课': '日干遥克四课上神，或神遥克干。事从外来，或需主动出击谋事。',
    '昴星课（无遥克）': '四课全无克，如虎踞视。事多阻滞，宜守静待时，妄动反招咎。',
    '伏吟课': '天地盘同，滞守之象。内部问题、旧事重提，守成为上。',
    '反吟课': '天地盘冲，反复变易。事快而多变，成败各半，宜灵活应对。',
    '八专课': '干支同气（干阳神与支阳神同），事连切身或私密。主独专或偏执，谨防一意孤行。',
    '别责课': '四课不全备，借合取传。事有欠缺不全，需借助外力或时机。贵在借势。',
  }
  let keTiDesc = ''
  for (const k of Object.keys(keTiDescMap)) {
    if (keTi.includes(k)) { keTiDesc = keTiDescMap[k]; break }
  }

  const a: string[] = []
  a.push('课体：' + keTi)
  if (keTiDesc) a.push('课义：' + keTiDesc)

  const chuKong = kong.includes(chuChuan)
  const zhongKong = kong.includes(zhongChuan)
  const moKong = kong.includes(moChuan)
  const kwInfo: string[] = []
  if (chuKong) kwInfo.push('初传' + chuChuan + '坐空亡')
  if (zhongKong) kwInfo.push('中传' + zhongChuan + '坐空亡')
  if (moKong) kwInfo.push('末传' + moChuan + '坐空亡')
  if (kwInfo.length) {
    a.push('空亡：今日旬空' + kong[0] + '、' + kong[1] + '，' + kwInfo.join('、') + '。')
    a.push('  空亡主事虚、有始无终、机遇落空。须待逢冲之年月日方可填实应事。')
  } else {
    a.push('空亡：今日旬空' + kong[0] + '、' + kong[1] + '，三传未见空亡，事体真实不虚。')
  }

  const monthZhi = monthGz[1]
  const wxStates = WANG_XIANG_SI_JI[monthZhi] || {}
  const wxNames = ['木', '火', '土', '金', '水']
  const statesText = wxNames.map(wx => wx + (wxStates[wx] || '休'))
  a.push('时令：' + monthZhi + '月，' + statesText.join('、') + '。')

  for (const [label, z] of [['初传', chuChuan], ['中传', zhongChuan], ['末传', moChuan]] as [string, string][]) {
    const wx = ZHI_WUXING[z]
    const state = wxStates[wx] || '休'
    if (state === '旺') a.push('  ' + label + z + '（' + wx + '）当令而旺，力量最强。')
    else if (state === '相') a.push('  ' + label + z + '（' + wx + '）当季次旺（相），有余力。')
    else if (state === '休') a.push('  ' + label + z + '（' + wx + '）休囚，力量减弱。')
    else if (state === '囚') a.push('  ' + label + z + '（' + wx + '）囚困，受制难以发挥。')
    else a.push('  ' + label + z + '（' + wx + '）逢死地，毫无生气。')
  }

  const riGanWx = GAN_WUXING[riGan]
  const rgState = wxStates[riGanWx] || '休'
  if (rgState === '旺') a.push('日干' + riGan + '（' + riGanWx + '）当令，身旺能担财官，外克可御、外生得益。')
  else if (rgState === '死') a.push('日干' + riGan + '（' + riGanWx + '）逢死地，元气不足，宜静不宜动。')

  for (const [label, z] of [['初传', chuChuan], ['中传', zhongChuan], ['末传', moChuan]] as [string, string][]) {
    const zwx = ZHI_WUXING[z]
    const zstate = wxStates[zwx] || '休'
    if (wuxingKe(zwx, riGanWx)) {
      if (zstate === '旺' || zstate === '相') a.push('  ' + label + z + '（' + zwx + '当令' + zstate + '）克日干' + riGan + '，克力强，阻力大。')
      else a.push('  ' + label + z + '（' + zwx + '失令' + zstate + '）虽克日干' + riGan + '，但克力减半，外强中干。')
    }
    if (wuxingSheng(zwx, riGanWx)) {
      if (zstate === '旺' || zstate === '相') a.push('  ' + label + z + '（' + zwx + '当令' + zstate + '）生日干' + riGan + '，生力充足，大吉。')
      else a.push('  ' + label + z + '（' + zwx + '失令' + zstate + '）生日干' + riGan + '，生力有限，聊胜于无。')
    }
  }

  a.push('初传' + chuChuan + '（' + chuWx + '）发端，事之始。')
  if (wuxingKe(chuWx, riGanWx)) a.push('初传' + chuWx + '克日干' + riGanWx + '（我），外力压制，事主被动。')
  else if (wuxingKe(riGanWx, chuWx)) a.push('日干' + riGanWx + '克初传' + chuWx + '（我制事），可主动掌控局面。')
  else if (wuxingSheng(chuWx, riGanWx)) a.push('初传' + chuWx + '生日干' + riGanWx + '，外有助益，事可顺成，大吉。')
  else if (wuxingSheng(riGanWx, chuWx)) a.push('日干' + riGanWx + '生初传' + chuWx + '，需付出资源与精力。')
  else a.push('初传与日干比和，事态平稳中性。')
  a.push('中传' + zhongChuan + '、末传' + moChuan + '，示发展与结局。')

  const jiangDesc: Record<string, string> = {
    '贵人': '贵助提携，事有靠山', '螣蛇': '虚惊怪异，事多波折变幻',
    '朱雀': '文书口舌，消息往来', '六合': '和合喜事，人缘聚合',
    '勾陈': '争斗迟滞，牵绊拖累', '青龙': '喜庆财富，大吉大利',
    '天空': '虚诈无凭，空头支票', '白虎': '凶伤压力，威严刚猛',
    '太常': '宴乐衣帛，平稳顺遂', '玄武': '盗贼暗昧，隐秘流失',
    '太阴': '阴私密谋，暗箱运作', '天后': '恩泽荫庇，阴贵扶助',
  }
  for (const [label, j] of [['初传', chuJiang], ['中传', zhongJiang], ['末传', moJiang]] as [string, string][]) {
    if (j) a.push(label + '临' + j + '：' + (jiangDesc[j] || ''))
  }

  const ci = zhiIdx(chuChuan), zi = zhiIdx(zhongChuan), mi = zhiIdx(moChuan)
  if ((zi - ci) % 12 === 1 && (mi - zi) % 12 === 1) {
    a.push('三传进连茹：' + chuChuan + '→' + zhongChuan + '→' + moChuan + '，三辰相连如串珠。事势连贯推进，节节向上。')
  } else if ((zi - ci) % 12 === 11 && (mi - zi) % 12 === 11) {
    a.push('三传退连茹：' + chuChuan + '→' + zhongChuan + '→' + moChuan + '，三辰相连如串珠。事势连环退守，步步收缩。')
  }

  const chain2: string[] = []
  if (wuxingSheng(chuWx, zhongWx)) chain2.push('初' + chuWx + '生中' + zhongWx)
  else if (wuxingKe(chuWx, zhongWx)) chain2.push('初' + chuWx + '克中' + zhongWx)
  if (wuxingSheng(zhongWx, moWx)) chain2.push('中' + zhongWx + '生末' + moWx)
  else if (wuxingKe(zhongWx, moWx)) chain2.push('中' + zhongWx + '克末' + moWx)
  if (chain2.length) a.push('五行传变：' + chain2.join(' → '))

  a.push('刑冲合害：' + xingChong.join('；'))

  const badJiang = new Set(['螣蛇', '勾陈', '天空', '白虎', '玄武'])
  const goodJiang = new Set(['贵人', '六合', '青龙', '太常', '天后'])
  const verdict: string[] = []
  if (chuKong) verdict.push('初传空亡，事体虚浮，虎头蛇尾之象')
  if (goodJiang.has(chuJiang) && wuxingSheng(chuWx, riGanWx)) verdict.push('初传吉将相生，外有贵人，事可成')
  else if (goodJiang.has(chuJiang) && !wuxingKe(chuWx, riGanWx)) verdict.push('天将吉利，总体向好')
  else if (badJiang.has(chuJiang) && wuxingKe(chuWx, riGanWx)) verdict.push('初传凶将相克，宜静守，不宜妄动')
  else if (badJiang.has(chuJiang)) verdict.push('天将欠佳，谨防小人波折')
  else if (wuxingKe(chuWx, riGanWx)) verdict.push('虽有克制之力，应对得法仍可转圜')
  else verdict.push('吉凶参半，事在人为')
  let shengRiCount = 0
  for (const z of [chuChuan, zhongChuan, moChuan]) {
    if (wuxingSheng(ZHI_WUXING[z], riGanWx)) shengRiCount += 1
  }
  if (shengRiCount >= 2) verdict.push('三传两生入日，整体获益之势明显')
  a.push('综合判断：' + verdict.join('，') + '。')

  a.push('')
  a.push('【应期参考】')
  const yima = shenSha['驿马']
  if ([chuChuan, zhongChuan, moChuan].includes(yima)) a.push('  课传见驿马' + yima + '，主速，逢' + (LIU_CHONG[yima] || '') + '日/月为应。')
  if (chuKong || zhongKong || moKong) {
    const kw = chuKong ? kong[0] : (zhongKong ? kong[1] : kong[0])
    a.push('  逢' + (LIU_CHONG[kw] || '') + '日/月（冲空亡）填实应事；' + kw + '月为空亡落期，主虚。')
  }
  a.push('  三传' + chuChuan + '（初）→' + zhongChuan + '（中）→' + moChuan + '（末）')
  a.push('  应期看' + chuChuan + '日/月（发端），' + moChuan + '日/月（结果）。')
  a.push('  贵人' + gr[0] + '为天门，逢' + gr[0] + '日/月或与三传相合各有应期。')

  const zhuanXiang: Record<string, string> = {
    '财运': '青龙临传则财路亨通，太常临传则收入稳定。玄武临财防破财失窃，辰戌丑未为财库。空亡落财爻则财虚难聚。',
    '灵犀一念': '心念所至，自有回响。课传见六合则缘分聚合，见天后则心暖有依，见青龙则灵感涌动；天空玄武主思绪纷扰，静心方见清明。驿马发动，一念既起便动身，灵犀自会在路上相逢。',
    '事业': '贵人青龙临传，升迁有望。勾陈白虎临，竞争激烈。空亡临官爻则职位虚悬或晋升搁置。',
    '婚姻': '六合天后为婚姻正神。六合临桃花则姻缘和合。螣蛇玄武忌见，主感情隐情或虚情假意。',
    '健康': '白虎为病符，临日干或三传防病。青龙临日则体泰。辰戌丑未临白虎防脾胃，申酉临白虎防筋骨。空亡临则病易去。',
    '诉讼': '朱雀勾陈主讼。朱雀旺相则文书有利，勾陈临克则诉久不决。贵人临传有调解之机。',
    '出行': '驿马发动利于行。青龙临马则出行有获。白虎临马防意外。空亡临马则事难成行。',
    '学业': '文昌朱雀主文思。朱雀临文昌则发挥出色。天空玄武临防失误或作弊嫌疑。',
    '交易': '六合青龙利合作。六合临财则共赢。勾陈临财则合同需细查。玄武临防欺诈空头。',
  }
  const qDesc = zhuanXiang[questionType] || '结合以上课像综合研判，吉凶需紧扣事体。'
  a.push('')
  a.push('【' + questionType + '专项】' + qDesc)

  const sanchuanLine = (role: string, z: string, jiang: string): string => {
    const wx = ZHI_WUXING[z]
    let line = role + '·' + z + '（' + wx + '）'
    if (jiang) line += '临' + jiang
    let extra = ''
    if (wuxingSheng(wx, riGanWx)) extra = '生助日干，外有助力，心意易成。'
    else if (wuxingKe(wx, riGanWx)) extra = '克制日干，阻力暗藏，宜缓不宜急。'
    else if (wuxingSheng(riGanWx, wx)) extra = '日干生之，须先付出诚意，方见回响。'
    else if (wuxingKe(riGanWx, wx)) extra = '日干制之，一念可定，主动权在己。'
    else extra = '与日干比和，事态平稳，顺势而为。'
    return line + '：' + extra
  }

  const jiangHint = (jiang: string): string => {
    const hints: Record<string, string> = {
      '贵人': '贵人暗助，心念坚定处自有提携。',
      '螣蛇': '思绪盘绕，先安顿自己再看前路。',
      '朱雀': '消息将动，一句话也许就是转机。',
      '六合': '缘聚之象，一念相通，人自会来。',
      '勾陈': '牵绊迟滞，放下执念反而更快。',
      '青龙': '灵光乍现，直觉可信，大胆落笔。',
      '天空': '心绪浮散，勿轻信眼前，守住本心。',
      '白虎': '压力当前，锋芒暂收，养气再进。',
      '太常': '安稳顺遂，寻常处亦有福气暗涌。',
      '玄武': '暧昧难明，先辨真假，再付真心。',
      '太阴': '心思幽微，有些事只可意会。',
      '天后': '心暖有依，善意回向，如沐春风。',
    }
    return hints[jiang] || ''
  }

  return {
    date: dateStr,
    ganzhi: yearGz + '年 ' + monthGz + '月 ' + dayGz + '日 ' + zhanShi + '时',
    yueJiang: jieqi.jiang + '（' + jieqi.zhi + '）',
    jieqi: jieqi.name,
    yueJiangExact: jieqi.time,
    question: questionType,
    keTi: keTi,
    keTiDesc: keTiDesc,
    siKe: [
      '课一（干阳）' + siKe[0][0] + ' → ' + siKe[0][1],
      '课二（干阴）' + siKe[1][0] + ' → ' + siKe[1][1],
      '课三（支阳）' + siKe[2][0] + ' → ' + siKe[2][1],
      '课四（支阴）' + siKe[3][0] + ' → ' + siKe[3][1],
    ],
    sanChuan: { chu: chuChuan, zhong: zhongChuan, mo: moChuan },
    sanChuanJiang: { chu: chuJiang, zhong: zhongJiang, mo: moJiang },
    shunni: shunni,
    shenSha: shenSha,
    xingChong: xingChong,
    wuxingText: wuxingText,
    duanKe: a,
    lines: [
      sanchuanLine('初传', chuChuan, chuJiang),
      sanchuanLine('中传', zhongChuan, zhongJiang),
      sanchuanLine('末传', moChuan, moJiang),
    ],
    hints: [jiangHint(chuJiang), jiangHint(zhongJiang), jiangHint(moJiang)],
    yingQi: [
      '驿马' + shenSha['驿马'] + '，' + ([chuChuan, zhongChuan, moChuan].includes(yima) ? '已入三传，事主速' : '未入三传，事缓') + '。',
      '空亡' + kong[0] + '、' + kong[1] + '，' + (kwInfo.length ? '三传有坐空，逢冲填实' : '三传无空，事体真实') + '。',
      '应期看' + chuChuan + '日/月发端，' + moChuan + '日/月结果。',
    ],
    action: '把刚才一闪而过的念头记下来，那就是今天的灵犀。',
  }
}
