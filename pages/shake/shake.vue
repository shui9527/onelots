<template>
  <view class="page">
    <!-- 标题 -->
    <view class="header">
      <text class="mode-name">{{ modeName }}</text>
      <text class="mode-sub">{{ modeSub }}</text>
    </view>

    <!-- 签筒 + 摇签动画占位（M1 骨架：静态签筒；M3 接入抖动/翻转动画） -->
    <view class="tube-area">
      <image
        class="tube-img"
        src="/static/image/fortune_bamboo_tube.png"
        mode="aspectFit"
      />
    </view>

    <!-- 提示语 -->
    <view class="tip">
      <text>默念心中所愿，轻触签筒摇一签</text>
    </view>

    <!-- 摇签按钮（M3 接入摇签音效 bamboo_shake.mp3 与揭晓音效 fortune_reveal.mp3） -->
    <view class="shake-btn" @tap="doShake">
      <text>摇一签</text>
    </view>

    <!-- 底部占位说明 -->
    <view class="footer-tip">M1 页面骨架 · 摇签页（mode={{ mode }} / category={{ category }}）</view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const mode = ref('normal')
const category = ref('')

const modeName = ref('')
const modeSub = ref('')

const MODE_META: Record<string, { name: string; sub: string }> = {
  normal: { name: '普通求签', sub: '分类签文 · 今日/事业/人际/生活/财运/灵犀' },
  liuyao: { name: '信手拈来', sub: '六爻起卦 · 摇六爻装卦断卦' },
  liuren: { name: '灵犀一念', sub: '大六壬起课 · 四课三传断课' },
}

onLoad((query: Record<string, string>) => {
  mode.value = query.mode || 'normal'
  category.value = query.category || ''
  const meta = MODE_META[mode.value] || MODE_META.normal
  modeName.value = meta.name
  modeSub.value = meta.sub
})

function doShake() {
  // M3 阶段：播放 bamboo_shake.mp3 → 动画 → 计算/抽取结果 → 播放 fortune_reveal.mp3 → 跳结果页
  // M2 阶段：六壬/六爻引擎纯函数完成后在此调用，普通签调用 fortunes.ts 权重抽取
  uni.showToast({ title: '摇签动画将在 M3 阶段接入', icon: 'none' })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: 24rpx;
  background: linear-gradient(180deg, #fdf6ec 0%, #f8efe3 100%);
  box-sizing: border-box;
}

.header {
  padding: 40rpx 20rpx 20rpx;
  text-align: center;
}
.mode-name {
  display: block;
  font-size: 44rpx;
  font-weight: 700;
  color: #4a2c17;
}
.mode-sub {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #8a6b4a;
}

.tube-area {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 640rpx;
}
.tube-img {
  width: 360rpx;
  height: 560rpx;
}

.tip {
  text-align: center;
  font-size: 26rpx;
  color: #8a6b4a;
}

.shake-btn {
  margin: 48rpx auto 0;
  width: 320rpx;
  height: 96rpx;
  line-height: 96rpx;
  border-radius: 48rpx;
  background: #c0392b;
  color: #fff;
  font-size: 34rpx;
  font-weight: 600;
  text-align: center;
  box-shadow: 0 8rpx 20rpx rgba(192, 57, 43, 0.3);
}

.footer-tip {
  margin-top: 60rpx;
  text-align: center;
  font-size: 22rpx;
  color: #b5a189;
}
</style>
