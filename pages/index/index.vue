<template>
  <view class="page">
    <!-- 状态栏占位（custom 导航） -->
    <view :style="{ height: statusBarHeight + 'px' }"></view>

    <!-- ================= 主页 ================= -->
    <!-- 顶栏：两行品牌 + 玩法 / 我的签缘 -->
    <view class="topbar">
      <view class="brand">
        <view class="brand-line">
          <text class="b-red">一签</text><text class="b-rest">·心愿</text>
        </view>
        <text class="brand-sub">把心事交给一缕清风</text>
      </view>
      <view class="topbar-btns">
        <view class="topbar-btn" @tap="openMask('play')">
          <image class="ico-img" src="/static/image/icon/tips.png" mode="aspectFit" />
          <text>玩法</text>
        </view>
        <view class="topbar-btn" @tap="openHis">
          <image class="ico-img" src="/static/image/icon/record.png" mode="aspectFit" />
          <text>我的签缘</text>
        </view>
      </view>
    </view>
    <view class="hairline"></view>

    <!-- 主标：三行 -->
    <view class="hero">
      <view class="hero-l1">一签一念 · 万事随心</view>
      <view class="hero-title">心有所念，签有所应</view>
      <view class="hero-l3">不问命定的答案，只愿此刻的你多一分从容。</view>
    </view>

    <!-- 签筒：左竖排 | 签筒 | 右竖排 -->
    <view class="tube-area">
      <view class="tube-side">
        <text class="v-text">诚心一念</text>
        <view class="v-line"></view>
      </view>
      <view class="tube-wrap" :class="{ shaking: shaking }" @tap="doShake">
        <view class="tube-glow"></view>
        <image class="tube-img" src="/static/image/fortune_bamboo_tube.png" mode="aspectFit" />
      </view>
      <view class="tube-side">
        <view class="v-line"></view>
        <text class="v-text">万事随心</text>
      </view>
    </view>

    <!-- 指引文本 -->
    <view class="guide">轻点签筒，摇签解意</view>

    <!-- 主文本区 -->
    <view class="main-text">
      <view class="mt-1">今日，想问些什么？</view>
      <view class="mt-2">选一份心意，让竹签为你捎来一句。</view>
    </view>

    <!-- 分支卡片区：2x2 × 2页，左右箭头 -->
    <view class="branch-block">
      <view class="arrow-btn" :class="{ disabled: page === 0 }" @tap="prevPage">‹</view>
      <swiper
        class="branch-swiper"
        :current="page"
        @change="onSwiperChange"
      >
        <swiper-item>
          <view class="branch-grid">
            <view
              v-for="c in pageCards(0)"
              :key="c.name"
              class="ticket"
              :class="{ on: selected && selected.name === c.name }"
              @tap="selectCard(c)"
            >
              <image class="t-ico" :src="c.icon" mode="aspectFit" />
              <view class="t-body">
                <view class="t-name">{{ c.name }}</view>
                <view class="t-sub">{{ c.sub }}</view>
              </view>
            </view>
          </view>
        </swiper-item>
        <swiper-item>
          <view class="branch-grid">
            <view
              v-for="c in pageCards(1)"
              :key="c.name"
              class="ticket"
              :class="{ on: selected && selected.name === c.name }"
              @tap="selectCard(c)"
            >
              <image class="t-ico" :src="c.icon" mode="aspectFit" />
              <view class="t-body">
                <view class="t-name">{{ c.name }}</view>
                <view class="t-sub">{{ c.sub }}</view>
              </view>
            </view>
          </view>
        </swiper-item>
      </swiper>
      <view class="arrow-btn" :class="{ disabled: page === 1 }" @tap="nextPage">›</view>
    </view>

    <view class="branch-dots"></view>

    <!-- 第二文本区：所选卡片 hint -->
    <view class="quote-block">{{ selected ? selected.hint : '' }}</view>

    <!-- 摇筒求签 -->
    <view class="bottom-bar">
      <view class="shake-btn" @tap="doShake">
        <text>摇筒求签</text>
      </view>
    </view>

    <!-- ================= 签文弹窗 ================= -->
    <view v-if="maskSig" class="mask" @tap="closeMask('sig')">
      <view class="sheet" :key="'sig-' + (currentSign ? currentSign.id : '')" @tap.stop>
        <view class="sheet-title">
          <text class="st-name">与此签结缘</text>
          <view class="st-x" @tap="closeMask('sig')">×</view>
        </view>
        <view class="hairline"></view>

        <view class="sheet-block center">
          <view class="sig-no ink-anim">{{ currentSign ? (currentSign.no ? currentSign.no + ' / ' + currentSign.cat : currentSign.cat) : '' }}</view>
          <view class="sig-grade ink-anim">{{ currentSign ? currentSign.grade : '' }}</view>
          <view class="sig-title ink-anim">{{ currentSign ? currentSign.title : '' }}</view>
          <view class="sig-poem ink-anim">
            <text v-for="(line, i) in currentSign ? currentSign.poem : []" :key="i" class="poem-line">{{ line }}</text>
          </view>
        </view>

        <view class="sig-hairline"></view>

        <view class="sig-block">
          <view class="sig-label ink-anim">签 文 解 读</view>
          <view class="sig-text ink-anim">{{ currentSign ? currentSign.meaning : '' }}</view>
          <view class="sig-note ink-anim">{{ currentSign ? currentSign.note : '' }}</view>
        </view>

        <view class="sig-block">
          <view class="sig-actionbox">
            <view class="ab-title ink-anim">今日小行动</view>
            <view class="ab-text ink-anim">{{ currentSign ? currentSign.action : '' }}</view>
          </view>
        </view>

        <view class="sig-block">
          <view class="sig-disclaimer ink-anim">签文为原创娱乐内容，不代表真实预测。</view>
        </view>

        <view class="sig-btns">
          <view class="btn btn-ghost" @tap="toggleCollect">{{ collectedText }}</view>
          <view class="btn btn-red" @tap="againSign">再求一签</view>
        </view>
      </view>
    </view>

    <!-- ================= 玩法说明弹窗 ================= -->
    <view v-if="maskPlay" class="mask" @tap="closeMask('play')">
      <view class="sheet" @tap.stop>
        <view class="sheet-title">
          <text class="st-name">求签小笺</text>
          <view class="st-x" @tap="closeMask('play')">×</view>
        </view>
        <view class="hairline"></view>

        <view class="sheet-block">
          <view class="play-head">一签一念，万事随心</view>
          <view class="play-rules">
            <view class="rule-line">一、选择今日、事业、情感等主题。</view>
            <view class="rule-line">二、心中默念，点击签筒或「摇筒求签」。</view>
            <view class="rule-line">三、等待竹签落定，阅读签文。</view>
            <view class="rule-line">四、灵犀一念采用大六壬起课三传。</view>
            <view class="rule-line">五、信手拈来采用六爻装卦断卦。</view>
            <view class="rule-line">六、抽签仅供休闲娱乐，请勿据此做出重要决定。</view>
          </view>
        </view>

        <view class="btn-full" @tap="closeMask('play')">心意已明</view>
      </view>
    </view>

    <!-- ================= 财运亨通（每日财运签）弹窗 ================= -->
    <view v-if="maskCy" class="mask" @tap="closeMask('cy')">
      <view class="sheet" :key="'cy-' + (currentCy ? currentCy.id : '')" @tap.stop>
        <view class="sheet-title">
          <text class="st-name">与此签结缘</text>
          <view class="st-x" @tap="closeMask('cy')">×</view>
        </view>
        <view class="hairline"></view>

        <view class="sheet-block center">
          <view class="cy-meta ink-anim">每日一签 / 财运亨通</view>
          <view class="cy-tag ink-anim">生肖送财</view>
          <view class="cy-date ink-anim">{{ currentCy ? currentCy.date : '' }}</view>
          <view class="cy-zodiac ink-anim">
            <view class="cy-z-row">
              <view v-for="(z, i) in currentCy ? currentCy.zodiac.slice(0, 4) : []" :key="i" class="cy-z-cell" :class="{ on: i === 0 }">{{ z }}</view>
            </view>
            <view class="cy-z-row">
              <view v-for="(z, i) in currentCy ? currentCy.zodiac.slice(4, 8) : []" :key="i" class="cy-z-cell">{{ z }}</view>
            </view>
          </view>
          <view class="cy-assert ink-anim">断言：</view>
          <view class="cy-poem typing">
            <text v-for="(row, ri) in cyPoemRows" :key="ri" class="poem-line">
              <text v-for="(c, ci) in row" :key="ci" class="char" :style="{ animationDelay: c.delay + 'ms' }">{{ c.ch }}</text>
            </text>
          </view>
          <view class="cy-disc ink-anim">（本内容仅供娱乐参考）</view>
        </view>

        <view class="sig-btns">
          <view class="btn btn-ghost" @tap="toggleBranchCollect('cy')">{{ branchCollectedText('cy') }}</view>
          <view class="btn btn-red" @tap="againCy">再求一签</view>
        </view>
      </view>
    </view>

    <!-- ================= 灵犀一念（大六壬）弹窗 ================= -->
    <view v-if="maskLx" class="mask" @tap="closeMask('lx')">
      <view class="sheet" :key="'lx-' + (currentLx ? currentLx.id : '')" @tap.stop>
        <view class="sheet-title">
          <text class="st-name">与此签结缘</text>
          <view class="st-x" @tap="closeMask('lx')">×</view>
        </view>
        <view class="hairline"></view>

        <view class="sheet-block center">
          <view class="lx-meta ink-anim">一课 / 灵犀一念</view>
          <view class="lx-keti ink-anim">{{ currentLx ? currentLx.keTi : '' }}</view>
        </view>

        <view class="sheet-block">
          <view class="lx-summary ink-anim">
            <view class="lx-keys">{{ currentLx ? currentLx.keyi : '' }}</view>
            <view v-for="(it, i) in currentLx ? currentLx.summary : []" :key="i" class="lx-item">
              <text class="lx-shen">{{ it.shen }}</text>
              <text class="lx-sval">{{ it.txt }}</text>
            </view>
          </view>
        </view>

        <view class="sheet-block">
          <view class="lx-board ink-anim">
            <view class="lx-line">{{ currentLx ? currentLx.ganzhi : '' }}</view>
            <view class="lx-line">{{ currentLx ? currentLx.yueJiang : '' }}</view>
            <view class="lx-stit">四课（地盘 → 天盘）</view>
            <view v-for="(k, i) in currentLx ? currentLx.siKe : []" :key="i" class="lx-line indent">{{ k }}</view>
            <view class="lx-stit">三传</view>
            <view class="lx-line">{{ currentLx ? currentLx.sanChuanTxt : '' }}</view>
            <view class="lx-line">{{ currentLx ? currentLx.sanChuanJiangTxt : '' }}</view>
          </view>
        </view>

        <view class="sheet-block">
          <view class="lx-detail ink-anim">
            <view class="lx-stit">断课详情</view>
            <view v-for="(t, i) in currentLx ? currentLx.detail : []" :key="i" class="lx-line">{{ t }}</view>
          </view>
        </view>

        <view class="sheet-block">
          <view class="lx-judgment ink-anim">{{ currentLx ? currentLx.judgment : '' }}</view>
        </view>

        <view class="sheet-block">
          <view class="lx-disc ink-anim">一课一签，为原创娱乐内容，不代表真实预测。</view>
        </view>

        <view class="sig-btns">
          <view class="btn btn-ghost" @tap="toggleBranchCollect('lx')">{{ branchCollectedText('lx') }}</view>
          <view class="btn btn-red" @tap="againLx">再求一签</view>
        </view>
      </view>
    </view>

    <!-- ================= 信手拈来（六爻）弹窗 ================= -->
    <view v-if="maskLy" class="mask" @tap="closeMask('ly')">
      <view class="sheet" :key="'ly-' + (currentLy ? currentLy.id : '')" @tap.stop>
        <view class="sheet-title">
          <text class="st-name">与此签结缘</text>
          <view class="st-x" @tap="closeMask('ly')">×</view>
        </view>
        <view class="hairline"></view>

        <view class="sheet-block center">
          <view class="ly-meta ink-anim">六爻 / 信手拈来</view>
          <view class="ly-gua ink-anim">{{ currentLy ? currentLy.title : '' }}</view>
        </view>

        <view class="sheet-block">
          <view class="ly-pan ink-anim">
            <view class="ly-pan-stit">六爻卦盘</view>
            <view class="ly-grid">
              <template v-for="(cell, i) in currentLy ? currentLy.pan : []" :key="i">
                <text class="ly-cell ly-cell-s">{{ cell.shen }}</text>
                <text class="ly-cell ly-cell-d">{{ cell.dz }}</text>
                <text class="ly-cell ly-cell-q">{{ cell.qin }}</text>
                <text class="ly-cell ly-cell-m">{{ cell.mark }}</text>
              </template>
            </view>
          </view>
        </view>

        <view class="sheet-block">
          <view class="ly-lines ink-anim">
            <view v-for="(it, i) in currentLy ? currentLy.lines : []" :key="i" class="ly-line" :class="{ red: it.red }">{{ it.t }}</view>
          </view>
        </view>

        <view class="sheet-block">
          <view class="ly-info ink-anim">
            <view class="ly-stit">卦盘解读</view>
            <view v-for="(it, i) in currentLy ? currentLy.info : []" :key="i" class="ly-line ly-info-line">{{ it.t }}</view>
          </view>
        </view>

        <view class="sheet-block">
          <view class="ly-disc ink-anim">（本内容仅供娱乐参考）</view>
        </view>

        <view class="sig-btns">
          <view class="btn btn-ghost" @tap="toggleBranchCollect('ly')">{{ branchCollectedText('ly') }}</view>
          <view class="btn btn-red" @tap="againLy">再求一签</view>
        </view>
      </view>
    </view>

    <!-- ================= 花语知梦（梅花易数）弹窗 ================= -->
    <view v-if="maskMh" class="mask" @tap="closeMask('mh')">
      <view class="sheet" :key="'mh-' + (currentMh ? currentMh.id : '')" @tap.stop>
        <view class="sheet-title">
          <text class="st-name">与此签结缘</text>
          <view class="st-x" @tap="closeMask('mh')">×</view>
        </view>
        <view class="hairline"></view>

        <view class="sheet-block center">
          <view class="ly-meta ink-anim">梅花易数 / 花语知梦</view>
          <view class="ly-gua ink-anim">{{ currentMh ? currentMh.title : '' }}</view>
        </view>

        <view class="sheet-block">
          <view class="ly-pan ink-anim">
            <view class="ly-pan-stit">梅花卦盘</view>
            <view class="ly-grid">
              <template v-for="(cell, i) in currentMh ? currentMh.pan : []" :key="i">
                <text class="ly-cell ly-cell-s">{{ cell.pos }}</text>
                <view class="ly-cell ly-cell-d">
                  <image v-if="cell.ben" class="yao-img yao-yang" src="/static/image/icon/yang.png" />
                  <image v-else class="yao-img yao-yin" src="/static/image/icon/yin.png" />
                </view>
                <view class="ly-cell ly-cell-q">
                  <image v-if="cell.bian" class="yao-img yao-yang" src="/static/image/icon/yang.png" />
                  <image v-else class="yao-img yao-yin" src="/static/image/icon/yin.png" />
                </view>
                <text class="ly-cell ly-cell-m">{{ cell.mark }}</text>
              </template>
            </view>
          </view>
        </view>

        <view class="sheet-block">
          <view class="ly-lines ink-anim">
            <view v-for="(it, i) in currentMh ? currentMh.lines : []" :key="i" class="ly-line" :class="{ red: it.red }">{{ it.t }}</view>
          </view>
        </view>

        <view class="sheet-block">
          <view class="ly-info ink-anim">
            <view class="ly-stit">卦盘解读</view>
            <view v-for="(it, i) in currentMh ? currentMh.info : []" :key="i" class="ly-line ly-info-line">{{ it.t }}</view>
          </view>
        </view>

        <view class="sheet-block">
          <view class="ly-disc ink-anim">（本内容仅供娱乐参考）</view>
        </view>

        <view class="sig-btns">
          <view class="btn btn-ghost" @tap="toggleBranchCollect('mh')">{{ branchCollectedText('mh') }}</view>
          <view class="btn btn-red" @tap="againMh">再求一签</view>
        </view>
      </view>
    </view>

    <!-- ================= 历史记录弹窗（我的签缘） ================= -->
    <view v-if="maskHis" class="mask" @tap="closeMask('his')">
      <view class="sheet" @tap.stop>
        <view class="sheet-title">
          <text class="st-name">我的签缘</text>
          <view class="st-x" @tap="closeMask('his')">×</view>
        </view>
        <view class="hairline"></view>

        <view class="his-head">轻点签文，重读那一份心意</view>
        <view class="his-sub">收藏的心意，都在这里。</view>

        <view class="his-list">
          <view v-for="s in collected" :key="s.id" class="h-item" @tap="viewCollected(s)">
            <image class="h-ico" :src="s.icon || catIcon(s.cat)" mode="aspectFit" />
            <view class="h-body">
              <view class="h-title">
                {{ s.title }}
                <text class="h-grade">{{ s.grade }}</text>
              </view>
              <view class="h-time">{{ s.cat }} · 已收藏</view>
            </view>
            <view class="h-go">›</view>
            <view class="h-del" @tap.stop="removeCollected(s)">×</view>
          </view>
        </view>
        <view v-if="collected.length === 0" class="his-empty">
          <image class="he-seal" src="/static/image/icon/record.png" mode="aspectFit" />
          <view class="he-t">尚未收藏签文</view>
          <view class="he-s">摇签后点「收藏此签」，把心意留在这里。</view>
        </view>

        <view class="his-foot">收藏在此，随时重读</view>
        <view class="btn-full his-btn" @tap="closeMask('his')">合上签册</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { entries, categoryNotes } from '@/data/fortunes'
import { caiyunNow, caiyunToday, todayKeyEast8 } from '@/engine/caiyun'
import { buildPaipan as buildLiuren } from '@/engine/liuren'
import { buildPaipan as buildLiuyao, BAGUA, GUA_NAME } from '@/engine/liuyao'
import { solarToLunarInfo } from '@/engine/lunar'

/* ---------- 页面基础 ---------- */
const statusBarHeight = ref(20)
try {
  const info = uni.getSystemInfoSync()
  statusBarHeight.value = info.statusBarHeight || 20
} catch (e) {
  /* 忽略 */
}

/* ---------- 分支卡片（8 张，2x2 × 2 页，按定稿预览稿） ---------- */
interface Card {
  name: string
  sub: string
  hint: string
  icon: string
  page: number
}
const cards: Card[] = [
  { name: '今日运势', sub: '一日好景', hint: '愿今天有一些小小的好运。', icon: '/static/image/icon/jin.png', page: 0 },
  { name: '人际情感', sub: '心意相知', hint: '愿真诚的心意被温柔接住。', icon: '/static/image/icon/qing.png', page: 0 },
  { name: '事业学业', sub: '前路可期', hint: '关于目标，听听内心的声音。', icon: '/static/image/icon/ye.png', page: 0 },
  { name: '生活灵感', sub: '寻常有光', hint: '从平凡日子里，拾起一点灵感。', icon: '/static/image/icon/huo.png', page: 0 },
  { name: '财运亨通', sub: '天助运宝', hint: '抓住机遇，闪耀金光。', icon: '/static/image/icon/cai.png', page: 1 },
  { name: '灵犀一念', sub: '心有所感', hint: '抓住稍瞬即逝的花火。', icon: '/static/image/icon/nian.png', page: 1 },
  { name: '信手拈来', sub: '心手相应', hint: '轻轻一挥手，顺风向前走。', icon: '/static/image/icon/xin.png', page: 1 },
  { name: '花语知梦', sub: '顺意解语', hint: '坐望云舒，去来皆有风景。', icon: '/static/image/icon/hua.png', page: 1 },
]

const page = ref(0)
const selected = ref<Card>(cards[0])
const shaking = ref(false)

function pageCards(p: number): Card[] {
  return cards.filter((c) => c.page === p)
}
function prevPage() {
  if (page.value > 0) page.value--
}
function nextPage() {
  if (page.value < 1) page.value++
}
function onSwiperChange(e: any) {
  page.value = e.detail.current
}
function selectCard(c: Card) {
  selected.value = c
}

/* ---------- 弹窗开关 ---------- */
const maskSig = ref(false)
const maskPlay = ref(false)
const maskHis = ref(false)
const maskCy = ref(false)
const maskLx = ref(false)
const maskLy = ref(false)
const maskMh = ref(false)

function closeMask(kind: 'sig' | 'play' | 'his' | 'cy' | 'lx' | 'ly' | 'mh') {
  if (kind === 'sig') maskSig.value = false
  if (kind === 'play') maskPlay.value = false
  if (kind === 'his') maskHis.value = false
  if (kind === 'cy') maskCy.value = false
  if (kind === 'lx') maskLx.value = false
  if (kind === 'ly') maskLy.value = false
  if (kind === 'mh') maskMh.value = false
}
function openMask(kind: 'sig' | 'play' | 'his' | 'cy' | 'lx' | 'ly' | 'mh') {
  if (kind === 'sig') maskSig.value = true
  if (kind === 'play') maskPlay.value = true
  if (kind === 'his') maskHis.value = true
  if (kind === 'cy') maskCy.value = true
  if (kind === 'lx') maskLx.value = true
  if (kind === 'ly') maskLy.value = true
  if (kind === 'mh') maskMh.value = true
}
function openHis() {
  renderHis()
  openMask('his')
}

/* ---------- 摇签 ---------- */
let shakeAudio: any = null
function playShake() {
  try {
    if (!shakeAudio) {
      shakeAudio = uni.createInnerAudioContext()
      shakeAudio.src = '/static/audio/bamboo_shake.mp3'
    }
    shakeAudio.stop()
    shakeAudio.play()
  } catch (e) {
    /* 音效播放失败不阻塞流程 */
  }
}

/** 按权重抽取普通签 */
function drawIndex(): number {
  let total = 0
  for (const e of entries) total += e.weight
  let r = Math.random() * total
  for (let i = 0; i < entries.length; i++) {
    r -= entries[i].weight
    if (r <= 0) return i
  }
  return 0
}

interface SignView {
  id: string
  no: number
  cat: string
  grade: string
  title: string
  poem: string[]
  meaning: string
  note: string
  action: string
}

const currentSign = ref<SignView | null>(null)

function pickNote(cat: string): string {
  const notes = categoryNotes[cat]
  if (notes && notes.length) {
    return notes[Math.floor(Math.random() * notes.length)]
  }
  return '今日寄语：从身边一件小小的好事开始，让心情轻一点。'
}

function drawSign() {
  const idx = drawIndex()
  const e = entries[idx]
  currentSign.value = {
    id: `sig-${idx + 1}-${selected.value.name}`,
    no: idx + 1,
    cat: selected.value.name,
    grade: e.grade,
    title: e.title,
    poem: e.poem,
    meaning: e.meaning,
    note: pickNote(selected.value.name),
    action: e.action,
  }
}

function doShake() {
  if (shaking.value) return
  shaking.value = true
  playShake()
  setTimeout(() => {
    shaking.value = false
    const name = selected.value.name
    if (name === '财运亨通') {
      genCy()
      openMask('cy')
    } else if (name === '灵犀一念') {
      genLx()
      openMask('lx')
    } else if (name === '信手拈来') {
      genLy()
      openMask('ly')
    } else if (name === '花语知梦') {
      genMh()
      openMask('mh')
    } else {
      drawSign()
      openMask('sig')
    }
  }, 850)
}

function againSign() {
  if (!currentSign.value) return
  // 再求一签：换一条不同签文
  let guard = 0
  let idx = drawIndex()
  while (entries[idx].title === currentSign.value.title && guard < 10) {
    idx = drawIndex()
    guard++
  }
  const e = entries[idx]
  currentSign.value = {
    id: `sig-${idx + 1}-${selected.value.name}`,
    no: idx + 1,
    cat: selected.value.name,
    grade: e.grade,
    title: e.title,
    poem: e.poem,
    meaning: e.meaning,
    note: pickNote(selected.value.name),
    action: e.action,
  }
}

/* ---------- 收藏：我的签缘（本地缓存持久化） ---------- */
const STORAGE_KEY = 'yiqian_my_signs_v1'

const CAT_ICONS: Record<string, string> = {
  今日运势: '/static/image/icon/jin.png',
  人际情感: '/static/image/icon/qing.png',
  事业学业: '/static/image/icon/ye.png',
  生活灵感: '/static/image/icon/huo.png',
  财运亨通: '/static/image/icon/cai.png',
  灵犀一念: '/static/image/icon/nian.png',
  信手拈来: '/static/image/icon/xin.png',
  花语知梦: '/static/image/icon/hua.png',
}

/** cat → 图标路径（无 icon 字段时兜底映射） */
function catIcon(cat: string): string {
  return CAT_ICONS[cat] || '/static/image/icon/record.png'
}

interface CollectedSign extends SignView {
  icon?: string
  savedAt: number
}

const collected = ref<CollectedSign[]>([])

function loadCollected(): CollectedSign[] {
  try {
    const v = uni.getStorageSync(STORAGE_KEY)
    return v && Array.isArray(v) ? v : []
  } catch (e) {
    return []
  }
}
function saveCollected() {
  try {
    uni.setStorageSync(STORAGE_KEY, collected.value)
  } catch (e) {
    /* 忽略 */
  }
}

const collectedText = computed(() => {
  if (!currentSign.value) return '收藏此签'
  return collected.value.some((s) => s.id === currentSign.value!.id) ? '已收藏' : '收藏此签'
})

function toggleCollect() {
  if (!currentSign.value) return
  const id = currentSign.value.id
  const i = collected.value.findIndex((s) => s.id === id)
  if (i >= 0) {
    collected.value.splice(i, 1)
    uni.showToast({ title: '已取消收藏', icon: 'none' })
  } else {
    collected.value.push({ ...currentSign.value, icon: catIcon(currentSign.value.cat), savedAt: Date.now() })
    uni.showToast({ title: '已收藏此签', icon: 'none' })
  }
  saveCollected()
}

function renderHis() {
  collected.value = loadCollected()
}

function viewCollected(s: CollectedSign) {
  currentSign.value = { ...s }
  openMask('sig')
}

function removeCollected(s: CollectedSign) {
  const i = collected.value.findIndex((x) => x.id === s.id)
  if (i >= 0) collected.value.splice(i, 1)
  saveCollected()
}

/* ================= 分支弹窗：财运亨通（每日财运签） ================= */
interface CyView {
  id: string
  date: string
  zodiac: string[]
  poem: string[]
}
const currentCy = ref<CyView | null>(null)

function splitPoemLines(poem: string): string[] {
  const arr = (poem || '').split(/<br\s*\/?>/i).map((x) => x.trim()).filter(Boolean)
  if (arr.length > 1) return arr
  // 七言两句：按逗号/句号拆为两行，每行七字（如「蛇衔玉钱守福地 / 家底渐丰乐无极」）
  return (poem || '').split(/[，,。]/).map((x) => x.trim()).filter(Boolean)
}

// 财运断言逐字浮现（方案A）：每字一帧，delay 跨行连续递增
const cyPoemRows = computed(() => {
  const lines = currentCy.value ? currentCy.value.poem : []
  let n = 0
  return lines.map((line) =>
    Array.from(line).map((ch) => ({ ch, delay: n++ * 70 }))
  )
})

function genCy() {
  const r = caiyunToday()
  currentCy.value = {
    id: 'cy-' + r.date.replace(/\D/g, ''),
    date: r.date,
    zodiac: r.zodiac,
    poem: splitPoemLines(r.poem),
  }
}
function againCy() {
  // 再求一签：以当前时间戳为种子换一份谶言，日期仍显示今天
  const r = caiyunNow(String(Date.now()))
  currentCy.value = {
    id: 'cy-' + Date.now(),
    date: todayKeyEast8(),
    zodiac: r.zodiac,
    poem: splitPoemLines(r.poem),
  }
}

/* ================= 分支弹窗：灵犀一念（大六壬起课） ================= */
interface LxItem {
  shen: string
  txt: string
}
interface LxView {
  id: string
  keTi: string
  keyi: string
  summary: LxItem[]
  ganzhi: string
  yueJiang: string
  siKe: string[]
  sanChuanTxt: string
  sanChuanJiangTxt: string
  detail: string[]
  judgment: string
}
const currentLx = ref<LxView | null>(null)

function genLx(hour?: number) {
  const now = new Date()
  const info = solarToLunarInfo(now.getFullYear(), now.getMonth() + 1, now.getDate())
  const h = hour !== undefined ? hour : now.getHours()
  const p: any = buildLiuren(info.lunar.year, Math.abs(info.lunar.month), info.lunar.day, h, '灵犀一念')
  const duanKe: string[] = Array.isArray(p.duanKe) ? p.duanKe : [String(p.duanKe || '')]
  // 三传判词：神煞名（冒号前）与判词（冒号后）分行展示
  const summary: LxItem[] = (p.lines || []).map((l: string) => {
    const idx = l.indexOf('：')
    return idx > 0 ? { shen: l.slice(0, idx), txt: l.slice(idx + 1) } : { shen: l, txt: '' }
  })
  // 断课详情：综合判断之前的课体/课义/空亡/时令/三传/临将/五行传变/刑冲合害等行
  const judgeIdx = duanKe.findIndex((t) => t.indexOf('综合判断：') === 0)
  const detail: string[] = (judgeIdx > 0 ? duanKe.slice(0, judgeIdx) : duanKe)
    .filter((t) => t && t.indexOf('【') !== 0)
  const yingQi = Array.isArray(p.yingQi) ? p.yingQi.filter(Boolean) : []
  if (yingQi.length) detail.push('应期：' + yingQi.join('；'))
  // 综合判断单独成句
  const judgeRow = duanKe.find((t) => t.indexOf('综合判断：') === 0)
  currentLx.value = {
    id: 'lx-' + p.ganzhi.replace(/\D/g, '') + '-' + p.sanChuan.chu,
    keTi: p.keTi || '灵犀一课',
    keyi: p.keTiDesc || '',
    summary,
    ganzhi: p.ganzhi,
    yueJiang: p.yueJiang,
    siKe: Array.isArray(p.siKe) ? p.siKe : [],
    sanChuanTxt: '三传：' + p.sanChuan.chu + ' → ' + p.sanChuan.zhong + ' → ' + p.sanChuan.mo,
    sanChuanJiangTxt: '天将：初传' + p.sanChuanJiang.chu + '、中传' + p.sanChuanJiang.zhong + '、末传' + p.sanChuanJiang.mo + (p.shunni ? '（' + p.shunni + '）' : ''),
    detail,
    judgment: judgeRow || '综合判断：课象已明，顺应天时。',
  }
}
function againLx() {
  // 再求一签：随机时辰重新起课，避免同一时辰结果不变
  genLx(Math.floor(Math.random() * 24))
}

/* ================= 分支弹窗：信手拈来（六爻装卦） ================= */
interface PanCellView {
  shen: string
  dz: string
  qin: string
  mark: string
}
interface LineView {
  t: string
  red: boolean
}
interface LyView {
  id: string
  title: string
  pan: PanCellView[]
  lines: LineView[]
  info: { t: string }[]
}
const currentLy = ref<LyView | null>(null)

function genLy() {
  const now = new Date()
  const info = solarToLunarInfo(now.getFullYear(), now.getMonth() + 1, now.getDate())
  const p: any = buildLiuyao(info.lunar.year, Math.abs(info.lunar.month), info.lunar.day, '信手拈来', Math.random)
  const lines: LineView[] = (p.lines || []).map((t: string) => ({
    t,
    red: /【断语】|【用神】/.test(t),
  }))
  currentLy.value = {
    id: 'ly-' + String(p.caseSolar || '').replace(/\D/g, '') + '-' + Math.floor(Math.random() * 1e6),
    title: p.title || '',
    pan: Array.isArray(p.panCells) ? p.panCells : [],
    lines,
    info: [
      { t: '日辰：' + p.ganzhi },
      { t: '月建：' + p.monthZhi + '月' },
      { t: '旬空：' + (Array.isArray(p.kong) ? p.kong.join('、') : String(p.kong || '')) },
      { t: '八宫：' + p.gong + '宫' },
      { t: '世爻：' + p.shi + '爻' },
      { t: '用神：' + (p.yongshen && p.yongshen.qin ? p.yongshen.qin : '妻财爻') },
      { t: '应期：' + (p.yingQi || '') },
    ].filter((x) => x.t !== '应期：'),
  }
}
function againLy() {
  genLy()
}

/* ================= 分支弹窗：花语知梦（梅花易数·时间起卦） ================= */
interface MhCellView {
  pos: string
  ben: string
  bian: string
  mark: string
}
interface MhView {
  id: string
  title: string
  pan: MhCellView[]
  lines: LineView[]
  info: { t: string }[]
}
const currentMh = ref<MhView | null>(null)

const MH_NUM_GUA = ['', '乾', '兑', '离', '震', '巽', '坎', '艮', '坤']
const MH_WUXING: Record<string, string> = { 乾: '金', 兑: '金', 离: '火', 震: '木', 巽: '木', 坎: '水', 艮: '土', 坤: '土' }
const MH_ZHI_NUM: Record<string, number> = { 子: 1, 丑: 2, 寅: 3, 卯: 4, 辰: 5, 巳: 6, 午: 7, 未: 8, 申: 9, 酉: 10, 戌: 11, 亥: 12 }
const HOUR_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const WX_SHENG: Record<string, string> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }
const WX_KE: Record<string, string> = { 金: '木', 木: '土', 土: '水', 水: '火', 火: '金' }
const MH_CN_NUM = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']

function mhGuaName(bits: number[]): string {
  for (const n of Object.keys(BAGUA)) {
    if (BAGUA[n].join('') === bits.join('')) return n
  }
  return '乾'
}

function genMh(hour?: number) {
  const now = new Date()
  const info = solarToLunarInfo(now.getFullYear(), now.getMonth() + 1, now.getDate())
  const yearZhi = info.ganzhi.year_lunar ? info.ganzhi.year_lunar[1] : '子'
  const monthNum = Math.abs(info.lunar.month)
  const dayNum = info.lunar.day
  const h = hour !== undefined ? hour : now.getHours()
  const hourZhi = HOUR_ZHI[h % 12]
  const yearNum = MH_ZHI_NUM[yearZhi] || 1
  const hourNum = MH_ZHI_NUM[hourZhi] || 1
  const up = ((yearNum + monthNum + dayNum - 1) % 8) + 1
  const down = ((yearNum + monthNum + dayNum + hourNum - 1) % 8) + 1
  const dong = ((yearNum + monthNum + dayNum + hourNum - 1) % 6) + 1
  const upGua = MH_NUM_GUA[up]
  const downGua = MH_NUM_GUA[down]
  const upBits = BAGUA[upGua]
  const downBits = BAGUA[downGua]
  const benBits = [...downBits, ...upBits] // 初→上
  const bianBits = benBits.map((b, i) => (i === dong - 1 ? (b ? 0 : 1) : b))
  const benName = GUA_NAME[downGua + upGua] || downGua + upGua
  const bianName = GUA_NAME[mhGuaName(bianBits.slice(0, 3)) + mhGuaName(bianBits.slice(3, 6))] || ''
  const huDown = mhGuaName(benBits.slice(1, 4))
  const huUp = mhGuaName(benBits.slice(2, 5))
  const huName = GUA_NAME[huDown + huUp] || huDown + huUp
  // 体用：动爻在下卦 → 用=下卦，体=上卦；动爻在上卦 → 用=上卦，体=下卦
  const tiGua = dong <= 3 ? upGua : downGua
  const yoGua = dong <= 3 ? downGua : upGua
  const tiWx = MH_WUXING[tiGua]
  const yoWx = MH_WUXING[yoGua]
  let shengke = ''
  let verdict = ''
  if (WX_SHENG[yoWx] === tiWx) {
    shengke = '用生体 · 主吉'
    verdict = '用生体主吉，谋事得贵人助，先难后易，所求可成。'
  } else if (WX_SHENG[tiWx] === yoWx) {
    shengke = '体生用 · 泄气'
    verdict = '体生用为泄，心意外流，宜守成蓄力，静待时机。'
  } else if (WX_KE[yoWx] === tiWx) {
    shengke = '用克体 · 主凶'
    verdict = '用克体，外势压身，宜缓不宜急，避其锋芒为吉。'
  } else if (WX_KE[tiWx] === yoWx) {
    shengke = '体克用 · 中平'
    verdict = '体克用，事在己手，需多费心力，稳扎稳打可成。'
  } else {
    shengke = '体用比和 · 主顺'
    verdict = '体用同气，事可自决，心平气和则顺。'
  }
  const monthName = info.lunar.month_name || String(monthNum) + '月'
  const dayTxt = dayNum <= 10 ? '初' + MH_CN_NUM[dayNum] : MH_CN_NUM[dayNum]
  const pan: MhCellView[] = []
  const posNames = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻']
  for (let i = 5; i >= 0; i--) {
    pan.push({
      pos: posNames[i],
      ben: benBits[i] === 1,
      bian: bianBits[i] === 1,
      mark: i === dong - 1 ? (benBits[i] ? '○' : '×') : '',
    })
  }
  currentMh.value = {
    id: 'mh-' + String(now.getFullYear()) + String(now.getMonth() + 1) + String(now.getDate()) + '-' + dong,
    title: benName + ' 之 ' + bianName,
    pan,
    lines: [
      { t: '【起卦】' + info.ganzhi.year_lunar + '年 ' + monthName + dayTxt + ' ' + hourZhi + '时 · 时间起卦', red: false },
      { t: '【占问】花语知梦，问心之所向', red: false },
      { t: '【体用】体' + tiGua + tiWx + ' · 用' + yoGua + yoWx + '（' + shengke + '）', red: false },
      { t: '【动爻】第' + dong + '爻动，变' + bianName, red: false },
      { t: '【互卦】' + huName, red: false },
      { t: '【断语】' + verdict, red: true },
      { t: '【应期】动在' + hourZhi + '时，近则数日，远则一旬，随缘而应。', red: false },
    ],
    info: [
      { t: '本卦：' + benName + '（上' + upGua + '下' + downGua + '）' },
      { t: '变卦：' + bianName },
      { t: '互卦：' + huName },
      { t: '体用：体' + tiGua + tiWx + ' / 用' + yoGua + yoWx },
      { t: '生克：' + shengke },
      { t: '五行：' + yoWx + '与' + tiWx + '相济，顺其自然。' },
    ],
  }
}
function againMh() {
  genMh()
}

/* ---------- 分支弹窗收藏（沿用 collected/saveCollected 持久化） ---------- */
function branchToCollected(kind: 'cy' | 'lx' | 'ly' | 'mh'): CollectedSign | null {
  if (kind === 'cy' && currentCy.value) {
    const v = currentCy.value
    return {
      id: v.id, no: 0, cat: '财运亨通', grade: '财运', title: '每日财运签 · ' + v.date,
      poem: v.poem, meaning: v.poem.join(''), note: '（本内容仅供娱乐参考）',
      action: '把握今日的每一个小机会，财气自来。',
      icon: catIcon('财运亨通'), savedAt: Date.now(),
    }
  }
  if (kind === 'lx' && currentLx.value) {
    const v = currentLx.value
    return {
      id: v.id, no: 0, cat: '灵犀一念', grade: '一课', title: v.keTi,
      poem: [v.ganzhi, v.sanChuanTxt], meaning: v.keyi + '。' + v.judgment,
      note: v.yueJiang + '；' + v.sanChuanJiangTxt,
      action: '把刚才一闪而过的念头记下来，那就是今天的灵犀。',
      icon: catIcon('灵犀一念'), savedAt: Date.now(),
    }
  }
  if (kind === 'ly' && currentLy.value) {
    const v = currentLy.value
    return {
      id: v.id, no: 0, cat: '信手拈来', grade: '六爻', title: v.title,
      poem: v.lines.map((l) => l.t),
      meaning: (v.lines.find((l) => l.t.indexOf('【断语】') >= 0) || { t: v.info.map((x) => x.t).join('；') }).t,
      note: v.info.map((x) => x.t).join('；'),
      action: '信手所感，顺势而为。',
      icon: catIcon('信手拈来'), savedAt: Date.now(),
    }
  }
  if (kind === 'mh' && currentMh.value) {
    const v = currentMh.value
    return {
      id: v.id, no: 0, cat: '花语知梦', grade: '梅花易数', title: v.title,
      poem: v.lines.map((l) => l.t),
      meaning: (v.lines.find((l) => l.t.indexOf('【断语】') >= 0) || { t: v.info.map((x) => x.t).join('；') }).t,
      note: v.info.map((x) => x.t).join('；'),
      action: '顺其自然，静待花开。',
      icon: catIcon('花语知梦'), savedAt: Date.now(),
    }
  }
  return null
}

function toggleBranchCollect(kind: 'cy' | 'lx' | 'ly' | 'mh') {
  const item = branchToCollected(kind)
  if (!item) return
  const i = collected.value.findIndex((s) => s.id === item.id)
  if (i >= 0) {
    collected.value.splice(i, 1)
    uni.showToast({ title: '已取消收藏', icon: 'none' })
  } else {
    collected.value.push(item)
    uni.showToast({ title: '已收藏此签', icon: 'none' })
  }
  saveCollected()
}

function branchCollectedText(kind: 'cy' | 'lx' | 'ly' | 'mh'): string {
  const item = branchToCollected(kind)
  if (!item) return '收藏此签'
  return collected.value.some((s) => s.id === item.id) ? '已收藏' : '收藏此签'
}
</script>

<style lang="scss" scoped>
/* 设计色板：红 #a64036 / 重点 #564f48 / 常规 #ada395 / 瓷白 #F6F4EF / 雾白 #EDEAE3 */
.page {
  min-height: 100vh;
  background: #edeae3;
  box-sizing: border-box;
  font-family: system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: #ada395;
}

/* ===== 顶栏 ===== */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 40rpx 16rpx;
}
.brand {
  display: flex;
  flex-direction: column;
  text-align: left;
}
.brand-line {
  font-size: 34rpx;
  font-weight: 700;
  letter-spacing: 4rpx;
  font-family: system-ui, -apple-system, 'PingFang SC', sans-serif;
}
.brand-line .b-red {
  color: #a64036;
}
.brand-line .b-rest {
  color: #ada395;
}
.brand-sub {
  margin-top: 6rpx;
  font-size: 20rpx;
  color: #ada395;
  letter-spacing: 2rpx;
}
.topbar-btns {
  display: flex;
  gap: 28rpx;
  align-self: flex-end;
}
.topbar-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 4rpx 4rpx;
  font-size: 24rpx;
  color: #ada395;
  letter-spacing: 2rpx;
}
.topbar-btn:active {
  color: #a64036;
}
.ico-img {
  width: 30rpx;
  height: 30rpx;
  object-fit: contain;
}

.hairline {
  height: 2rpx;
  background: #d9d4c8;
  margin: 0 40rpx;
}

/* ===== 主标 ===== */
.hero {
  padding: 40rpx 48rpx 0;
  text-align: center;
}
.hero-l1 {
  font-size: 24rpx;
  color: #a64036;
  letter-spacing: 10rpx;
}
.hero-title {
  margin-top: 20rpx;
  font-size: 48rpx;
  font-weight: 700;
  letter-spacing: 8rpx;
  color: #564f48;
}
.hero-l3 {
  margin-top: 20rpx;
  font-size: 22rpx;
  color: #ada395;
  letter-spacing: 2rpx;
  line-height: 1.7;
}

/* ===== 签筒 ===== */
.tube-area {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32rpx;
  padding: 0 0 0;
}
.tube-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  color: #ada395;
}
.v-text {
  writing-mode: vertical-rl;
  font-size: 22rpx;
  letter-spacing: 18rpx;
}
.v-line {
  width: 2rpx;
  height: 60rpx;
  background: #d9d4c8;
}
.tube-wrap {
  position: relative;
  width: 460rpx;
  height: 560rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tube-img {
  width: 316rpx;
  height: 504rpx;
  transition: transform 0.3s;
}
.tube-glow {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 480rpx;
  height: 480rpx;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(185, 138, 62, 0.15) 0%, rgba(185, 138, 62, 0) 62%);
  border-radius: 50%;
  pointer-events: none;
}
.tube-wrap.shaking .tube-img {
  animation: tubeShake 0.55s ease-in-out infinite;
}
@keyframes tubeShake {
  0% {
    transform: rotate(0deg) translateX(0);
  }
  20% {
    transform: rotate(-7deg) translateX(-8rpx);
  }
  40% {
    transform: rotate(6deg) translateX(8rpx);
  }
  60% {
    transform: rotate(-5deg) translateX(-6rpx);
  }
  80% {
    transform: rotate(4deg) translateX(6rpx);
  }
  100% {
    transform: rotate(0deg) translateX(0);
  }
}

/* ===== 指引 / 主文本 ===== */
.guide {
  position: relative;
  top: -20px;
  text-align: center;
  font-size: 22rpx;
  color: #bcb4a8;
  letter-spacing: 4rpx;
  padding: 0 48rpx 0;
}
.main-text {
  padding: 20rpx 48rpx 0;
  text-align: left;
}
.mt-1 {
  font-size: 38rpx;
  font-weight: 600;
  color: #564f48;
  letter-spacing: 4rpx;
}
.mt-2 {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #ada395;
  letter-spacing: 2rpx;
}

/* ===== 签文动态效果 ===== */
.ink-anim {
  opacity: 0;
  filter: blur(8px);
  animation: inkIn 1.2s ease forwards;
}
@keyframes inkIn {
  from {
    opacity: 0;
    filter: blur(8px);
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    filter: blur(0);
    transform: scale(1);
  }
}
.char {
  display: inline-block;
  opacity: 0;
  animation: charIn 0.6s ease forwards;
}
@keyframes charIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== 分支卡片区 ===== */
.branch-block {
  margin-top: 28rpx;
  margin-bottom: 4rpx;
  padding: 0 0rpx;
  display: flex;
  align-items: center;
  gap: 15rpx;
}
.branch-swiper {
  flex: 1;
  overflow: hidden;
  height: 288rpx;
}
.branch-swiper .swiper-item {
  display: flex;
}
.branch-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}
.ticket {
  width: calc(50% - 6rpx);
  background: #f6f4ef;
  border: 2rpx solid #d9d4c8;
  border-radius: 28rpx;
  padding: 26rpx 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  box-shadow: 0 6rpx 20rpx rgba(38, 51, 63, 0.06);
  box-sizing: border-box;
}
.ticket:active {
  transform: scale(0.95);
}
.ticket.on {
  border-color: #a64036;
}
.t-ico {
  width: 44rpx;
  height: 44rpx;
  flex: none;
}
.t-body {
  flex: none;
  min-width: 0;
}
.t-name {
  font-size: 28rpx;
  font-weight: 700;
  color: #564f48;
  letter-spacing: 2rpx;
  line-height: 1.3;
}
.ticket.on .t-name {
  color: #a64036;
}
.t-sub {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #bcb4a8;
  letter-spacing: 2rpx;
  line-height: 1.3;
}
.arrow-btn {
  width: 60rpx;
  height: 60rpx;
  border-radius: 14rpx;
  border: 2rpx solid #d9d4c8;
  background: #f6f4ef;
  color: #ada395;
  font-size: 30rpx;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}
.arrow-btn.disabled {
  opacity: 0.3;
  pointer-events: none;
}
/* ===== 第二文本区 ===== */
.quote-block {
  margin-top: 0rpx;
  padding: 0 52rpx 4rpx 96rpx;
  text-align: left;
  font-size: 24rpx;
  color: #ada395;
  letter-spacing: 2rpx;
  line-height: 1.7;
}

/* ===== 底部操作栏 ===== */
.bottom-bar {
  margin-top: 22rpx;
  padding: 8rpx 40rpx 22rpx;
  background: #edeae3;
  position: sticky;
  bottom: 0;
}
.shake-btn {
  margin: 0 auto;
  width: 82%;
  height: 100rpx;
  border-radius: 18rpx 18rpx 8rpx 8rpx;
  background: #a64036;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 600;
  letter-spacing: 8rpx;
  box-shadow: 0 10rpx 28rpx rgba(166, 64, 54, 0.24);
}
.shake-btn:active {
  transform: scale(0.97);
}
.shake-btn text {
  color: #fff;
}

/* ===== 弹窗通用 ===== */
.mask {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(38, 51, 63, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.sheet {
  width: 100%;
  max-height: 86vh;
  overflow-y: auto;
  background: #f6f4ef;
  border-radius: 36rpx 36rpx 0 0;
  padding: 40rpx 40rpx 48rpx;
  box-sizing: border-box;
  animation: sheetIn 0.28s ease;
}
@keyframes sheetIn {
  from {
    transform: translateY(80rpx);
    opacity: 0.4;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
.sheet-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 28rpx;
}
.st-name {
  font-size: 34rpx;
  font-weight: 700;
  letter-spacing: 6rpx;
  color: #564f48;
}
.st-x {
  width: 56rpx;
  height: 56rpx;
  border-radius: 16rpx;
  border: 2rpx solid #d9d4c8;
  color: #bcb4a8;
  font-size: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}
.sheet .hairline {
  margin: 0;
}
.sheet-block {
  padding: 32rpx 4rpx 0;
}
.sheet-block.center {
  text-align: center;
}

/* ===== 签文弹窗 ===== */
.sig-no {
  text-align: center;
  font-size: 22rpx;
  letter-spacing: 6rpx;
  color: #ada395;
}
.sig-grade {
  display: inline-block;
  margin-top: 24rpx;
  padding: 10rpx 32rpx 8rpx;
  border-radius: 8rpx;
  border: 2rpx solid #a64036;
  background: #f6f4ef;
  color: #a64036;
  font-size: 28rpx;
  font-weight: 600;
  letter-spacing: 6rpx;
}
.sig-title {
  margin-top: 24rpx;
  text-align: center;
  font-size: 52rpx;
  font-weight: 700;
  color: #564f48;
  letter-spacing: 12rpx;
  line-height: 1.4;
}
.sig-poem {
  margin-top: 32rpx;
  text-align: center;
  font-size: 34rpx;
  line-height: 2;
  color: #564f48;
  letter-spacing: 8rpx;
}
.poem-line {
  display: block;
}
.sig-hairline {
  margin: 36rpx 12rpx 0;
  border-top: 2rpx solid #d9d4c8;
}
.sig-block {
  padding: 28rpx 4rpx 0;
}
.sig-label {
  font-size: 24rpx;
  letter-spacing: 6rpx;
  color: #a64036;
  font-weight: 600;
}
.sig-text {
  margin-top: 16rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: #564f48;
}
.sig-note {
  margin-top: 20rpx;
  font-size: 22rpx;
  line-height: 1.65;
  color: #ada395;
}
.sig-actionbox {
  margin-top: 24rpx;
  padding: 26rpx 28rpx;
  border-radius: 12rpx;
  background: rgba(166, 64, 54, 0.07);
}
.ab-title {
  font-size: 24rpx;
  font-weight: 700;
  color: #a64036;
  letter-spacing: 4rpx;
}
.ab-text {
  margin-top: 14rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: #564f48;
}
.sig-disclaimer {
  margin-top: 32rpx;
  text-align: center;
  font-size: 18rpx;
  line-height: 1.7;
  color: #bcb4a8;
  letter-spacing: 2rpx;
}
.sig-btns {
  display: flex;
  gap: 24rpx;
  padding-top: 40rpx;
}
.btn {
  flex: 1;
  height: 100rpx;
  border-radius: 16rpx 16rpx 6rpx 6rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  letter-spacing: 4rpx;
  font-weight: 600;
}
.btn:active {
  transform: scale(0.97);
}
.btn-ghost {
  background: #f6f4ef;
  color: #564f48;
  border: 2rpx solid #d9d4c8;
  box-sizing: border-box;
}
.btn-red {
  background: #a64036;
  color: #fff;
}

/* ===== 玩法弹窗 ===== */
.play-head {
  font-size: 40rpx;
  font-weight: 700;
  color: #a64036;
  letter-spacing: 8rpx;
  text-align: center;
}
.play-rules {
  margin-top: 32rpx;
  font-size: 25rpx;
  color: #ada395;
  line-height: 2.1;
  letter-spacing: 2rpx;
}
.btn-full {
  width: 100%;
  height: 104rpx;
  margin-top: 36rpx;
  border-radius: 16rpx 16rpx 6rpx 6rpx;
  background: #a64036;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: 600;
  letter-spacing: 8rpx;
}
.btn-full:active {
  transform: scale(0.97);
}

/* ===== 历史记录弹窗（我的签缘） ===== */
.his-head {
  font-size: 34rpx;
  font-weight: 700;
  color: #a64036;
  letter-spacing: 6rpx;
  text-align: center;
  padding-top: 28rpx;
}
.his-sub {
  margin-top: 12rpx;
  font-size: 23rpx;
  color: #ada395;
  letter-spacing: 2rpx;
  text-align: center;
}
.his-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding-top: 28rpx;
}
.h-item {
  background: #edeae3;
  border-radius: 18rpx 18rpx 8rpx 8rpx;
  padding: 26rpx 24rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
}
.h-ico {
  width: 44rpx;
  height: 44rpx;
  color: #564f48;
  flex: none;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.h-body {
  flex: 1;
  min-width: 0;
}
.h-title {
  font-size: 26rpx;
  font-weight: 600;
  color: #ada395;
}
.h-grade {
  font-size: 21rpx;
  color: #a64036;
  margin-left: 12rpx;
  letter-spacing: 2rpx;
}
.h-time {
  margin-top: 8rpx;
  font-size: 21rpx;
  color: #bcb4a8;
  letter-spacing: 2rpx;
}
.h-go {
  color: #d9d4c8;
  font-size: 32rpx;
  flex: none;
}
.h-del {
  flex: none;
  width: 52rpx;
  height: 52rpx;
  margin-left: 12rpx;
  border-radius: 12rpx;
  color: #bcb4a8;
  border: 2rpx solid #d9d4c8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  box-sizing: border-box;
}
.his-empty {
  padding: 68rpx 0;
  text-align: center;
}
.he-seal {
  width: 104rpx;
  height: 104rpx;
  border-radius: 20rpx;
  margin: 0 auto 28rpx;
  border: 3rpx dashed #c6beb0;
  color: #c6beb0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 38rpx;
}
.he-t {
  font-size: 28rpx;
  color: #ada395;
  letter-spacing: 4rpx;
}
.he-s {
  margin-top: 14rpx;
  font-size: 22rpx;
  color: #bcb4a8;
}
.his-foot {
  padding-top: 28rpx;
  text-align: center;
  font-size: 20rpx;
  color: #c6beb0;
  letter-spacing: 2rpx;
}
.his-btn {
  margin-top: 32rpx;
}
/* 收藏图标改图片后适配 */
.h-ico {
  border-radius: 12rpx;
  background: #f6f4ef;
  padding: 6rpx;
  box-sizing: border-box;
}
.he-seal {
  border-style: none;
  background: #f6f4ef;
  padding: 22rpx;
  box-sizing: border-box;
}
/* ---------- 分支弹窗：财运亨通 ---------- */
.cy-meta {
  text-align: center;
  font-size: 22rpx;
  letter-spacing: 6rpx;
  color: #ada395;
}
.cy-tag {
  display: inline-block;
  margin-top: 20rpx;
  padding: 10rpx 32rpx 8rpx;
  border-radius: 6rpx;
  border: 2rpx solid #a64036;
  background: rgba(166, 64, 54, 0.07);
  color: #a64036;
  font-size: 26rpx;
  font-weight: 600;
  letter-spacing: 6rpx;
}
.cy-date {
  margin-top: 16rpx;
  font-size: 22rpx;
  color: #bcb4a8;
  letter-spacing: 2rpx;
  text-align: center;
}
.cy-zodiac {
  margin-top: 24rpx;
  padding: 24rpx;
  border-radius: 12rpx;
  background: rgba(166, 64, 54, 0.07);
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.cy-z-row {
  display: flex;
  gap: 16rpx;
}
.cy-z-cell {
  flex: 1;
  height: 72rpx;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f6f4ef;
  border: 2rpx solid #d9d4c8;
  font-size: 28rpx;
  font-weight: 600;
  color: #564f48;
  box-sizing: border-box;
}
.cy-z-cell.on {
  background: #a64036;
  border-color: #a64036;
  color: #fff;
}
.cy-assert {
  margin-top: 28rpx;
  font-size: 24rpx;
  font-weight: 700;
  color: #a64036;
  letter-spacing: 4rpx;
  padding-left: 168rpx;
  text-align: left;
}
.cy-poem {
  margin-top: 20rpx;
  text-align: center;
  font-size: 34rpx;
  font-weight: 600;
  color: #564f48;
  letter-spacing: 8rpx;
  line-height: 2;
}
.poem-line {
  display: block;
}
.cy-disc {
  margin-top: 28rpx;
  text-align: center;
  font-size: 18rpx;
  color: #bcb4a8;
  letter-spacing: 2rpx;
}
/* ---------- 分支弹窗：灵犀一念（大六壬） ---------- */
.lx-meta {
  text-align: center;
  font-size: 22rpx;
  letter-spacing: 6rpx;
  color: #ada395;
}
.lx-keti {
  display: inline-block;
  margin-top: 20rpx;
  padding: 10rpx 32rpx 8rpx;
  border-radius: 6rpx;
  border: 2rpx solid #a64036;
  background: rgba(166, 64, 54, 0.07);
  color: #a64036;
  font-size: 26rpx;
  font-weight: 600;
  letter-spacing: 6rpx;
}
.lx-summary {
  margin-top: 24rpx;
  padding: 24rpx 28rpx;
  border-radius: 12rpx;
  background: #edeae3;
}
.lx-keys {
  font-size: 24rpx;
  line-height: 1.7;
  color: #ada395;
}
.lx-item {
  margin-top: 16rpx;
}
.lx-shen {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #a64036;
  letter-spacing: 2rpx;
  text-align: center;
}
.lx-sval {
  display: block;
  margin-top: 6rpx;
  font-size: 32rpx;
  line-height: 1.7;
  color: #564f48;
  text-align: center;
}
.lx-board {
  margin-top: 24rpx;
  padding: 24rpx 28rpx 0;
  border-top: 2rpx dashed #d9d4c8;
}
.lx-board .lx-stit {
  color: #564f48;
}
.lx-detail {
  margin-top: 24rpx;
  padding: 24rpx 28rpx;
  border-radius: 12rpx;
  background: #edeae3;
}
.lx-judgment {
  margin-top: 24rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: #a64036;
  letter-spacing: 2rpx;
}
.lx-stit {
  font-size: 26rpx;
  font-weight: 700;
  color: #a64036;
  letter-spacing: 4rpx;
  margin-top: 20rpx;
}
.lx-stit:first-child {
  margin-top: 0;
}
.lx-line {
  font-size: 24rpx;
  line-height: 1.8;
  color: #564f48;
  margin-top: 4rpx;
}
.lx-line.indent {
  padding-left: 28rpx;
}
.lx-disc {
  margin-top: 28rpx;
  text-align: center;
  font-size: 18rpx;
  color: #bcb4a8;
  letter-spacing: 2rpx;
}
/* ---------- 分支弹窗：六爻 / 梅花易数 ---------- */
.ly-meta {
  text-align: center;
  font-size: 22rpx;
  letter-spacing: 6rpx;
  color: #ada395;
}
.ly-gua {
  display: inline-block;
  margin-top: 20rpx;
  padding: 10rpx 32rpx 8rpx;
  border-radius: 6rpx;
  border: 2rpx solid #a64036;
  background: rgba(166, 64, 54, 0.07);
  color: #a64036;
  font-size: 26rpx;
  font-weight: 600;
  letter-spacing: 6rpx;
}
.ly-pan {
  margin-top: 24rpx;
  padding: 24rpx 28rpx;
  border-radius: 12rpx;
  background: #edeae3;
  text-align: center;
}
.ly-pan-stit {
  font-size: 26rpx;
  font-weight: 700;
  color: #a64036;
  letter-spacing: 8rpx;
  text-align: center;
  margin-bottom: 12rpx;
}
.ly-grid {
  display: flex;
  flex-wrap: wrap;
  width: 512rpx;
  margin: 0 auto;
}
.ly-cell {
  font-size: 26rpx;
  line-height: 2.1;
  color: #ada395;
  text-align: left;
}
.ly-cell-s {
  width: 144rpx;
}
.ly-cell-d {
  width: 128rpx;
}
.ly-cell-q {
  width: 128rpx;
}
.ly-cell-m {
  width: 112rpx;
  color: #a64036;
}
.yao-img {
  height: 18rpx;
  display: inline-block;
}
.yao-yang {
  width: 85rpx;
}
.yao-yin {
  width: 85rpx;
}
.ly-lines {
  margin-top: 24rpx;
  padding: 0 28rpx;
}
.ly-line {
  font-size: 26rpx;
  line-height: 1.8;
  color: #ada395;
  letter-spacing: 2rpx;
  margin-top: 4rpx;
}
.ly-line.red {
  color: #a64036;
  font-size: 28rpx;
  font-weight: 700;
}
.ly-info {
  margin-top: 24rpx;
  padding: 24rpx 28rpx;
  border-radius: 12rpx;
  background: #edeae3;
}
.ly-stit {
  font-size: 26rpx;
  font-weight: 700;
  color: #a64036;
  letter-spacing: 4rpx;
}
.ly-info-line {
  font-size: 24rpx;
  line-height: 1.8;
  color: #564f48;
  margin-top: 4rpx;
}
.ly-disc {
  margin-top: 28rpx;
  text-align: center;
  font-size: 18rpx;
  color: #bcb4a8;
  letter-spacing: 2rpx;
}
</style>
