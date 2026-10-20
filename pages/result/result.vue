<template>
  <view class="page">
    <!-- 结果主区（M1 骨架：按 mode 占位；M3/M4 接入签文/卦象/课盘渲染） -->
    <view class="result-card">
      <view class="mode-tag">
        <text>{{ modeName }}</text>
      </view>
      <view class="placeholder">
        <text class="placeholder-title">结果占位</text>
        <text class="placeholder-desc">
          普通签：签文 + 分类寄语（fortunes.ts）\n六爻：卦象 + 爻位 + 断语（liuyao.ts）\n六壬：课盘 + 断语（liuren.ts）
        </text>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="actions">
      <view class="btn" @tap="again">再抽一次</view>
      <view class="btn plain" @tap="backHome">返回首页</view>
    </view>

    <!-- 底部占位说明 -->
    <view class="footer-tip">M1 页面骨架 · 结果页（mode={{ mode }} / category={{ category }}）</view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const mode = ref('normal')
const category = ref('')
const modeName = ref('普通求签')

const MODE_NAME: Record<string, string> = {
  normal: '普通求签',
  liuyao: '六爻 · 信手拈来',
  liuren: '六壬 · 灵犀一念',
  caiyun: '财运每日签',
}

onLoad((query: Record<string, string>) => {
  mode.value = query.mode || 'normal'
  category.value = query.category || ''
  modeName.value = MODE_NAME[mode.value] || MODE_NAME.normal
})

function again() {
  // M3/M4：重新进入对应摇签/财运流程
  if (mode.value === 'caiyun') {
    uni.redirectTo({ url: '/pages/caiyun/caiyun' })
  } else {
    uni.redirectTo({
      url: `/pages/shake/shake?mode=${mode.value}&category=${encodeURIComponent(category.value)}`,
    })
  }
}

function backHome() {
  uni.reLaunch({ url: '/pages/index/index' })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: 24rpx;
  background: linear-gradient(180deg, #fdf6ec 0%, #f8efe3 100%);
  box-sizing: border-box;
}

.result-card {
  margin-top: 40rpx;
  padding: 40rpx 32rpx;
  border-radius: 24rpx;
  background: #fffdf8;
  box-shadow: 0 4rpx 16rpx rgba(122, 84, 40, 0.08);
}
.mode-tag {
  display: inline-block;
  padding: 8rpx 24rpx;
  border-radius: 24rpx;
  background: #f4e6d3;
  font-size: 24rpx;
  color: #6b4a2c;
}
.placeholder {
  margin-top: 40rpx;
  text-align: center;
}
.placeholder-title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #4a2c17;
}
.placeholder-desc {
  display: block;
  margin-top: 20rpx;
  font-size: 24rpx;
  line-height: 1.8;
  color: #8a6b4a;
  white-space: pre-line;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 24rpx;
  margin-top: 48rpx;
}
.btn {
  width: 220rpx;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  background: #c0392b;
  color: #fff;
  font-size: 30rpx;
  text-align: center;
  box-shadow: 0 8rpx 20rpx rgba(192, 57, 43, 0.3);
}
.btn.plain {
  background: #fffdf8;
  color: #4a2c17;
  border: 2rpx solid #d8c4a8;
  box-shadow: none;
}

.footer-tip {
  margin-top: 60rpx;
  text-align: center;
  font-size: 22rpx;
  color: #b5a189;
}
</style>
