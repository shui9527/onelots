<template>
  <view class="page">
    <!-- 财运页头部 -->
    <view class="header">
      <text class="title">财运每日签</text>
      <text class="sub">生肖送财 · 每日一签</text>
    </view>

    <!-- 生肖与谶言展示区（M1 骨架：占位；M4 接入 caiyun.ts + 每日缓存） -->
    <view class="luck-card">
      <view class="zodiac-circle">
        <text class="zodiac-char">?</text>
      </view>
      <text class="zodiac-name">今日生肖（待生成）</text>
      <view class="poem-placeholder">
        <text>谶言大字展示区\n（M4 接入 caiyun.ts 72 条谶言 + 每日签缓存）</text>
      </view>
    </view>

    <!-- 取签按钮 -->
    <view class="btn" @tap="getLuck">
      <text>今日一签</text>
    </view>

    <!-- 底部占位说明 -->
    <view class="footer-tip">M1 页面骨架 · 财运页（uniCloud 云端缓存 + 本地缓存将在 M4/M5 接入）</view>
  </view>
</template>

<script setup lang="ts">
function getLuck() {
  // M4 阶段：todayKey() 东八区日期 → 本地缓存 dailyLuck_<key> → 无则生成 → 展示 → 异步 uniCloud 补写
  uni.showToast({ title: '财运签逻辑将在 M4 阶段接入', icon: 'none' })
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
.title {
  display: block;
  font-size: 44rpx;
  font-weight: 700;
  color: #4a2c17;
}
.sub {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #8a6b4a;
}

.luck-card {
  margin-top: 40rpx;
  padding: 48rpx 32rpx;
  border-radius: 24rpx;
  background: #fffdf8;
  box-shadow: 0 4rpx 16rpx rgba(122, 84, 40, 0.08);
  text-align: center;
}
.zodiac-circle {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  background: #f4e6d3;
}
.zodiac-char {
  font-size: 64rpx;
  font-weight: 700;
  color: #c0392b;
}
.zodiac-name {
  display: block;
  margin-top: 20rpx;
  font-size: 30rpx;
  font-weight: 600;
  color: #4a2c17;
}
.poem-placeholder {
  margin-top: 36rpx;
  padding: 32rpx 20rpx;
  border-top: 2rpx dashed #e4d3bb;
  font-size: 26rpx;
  line-height: 1.8;
  color: #8a6b4a;
  white-space: pre-line;
}

.btn {
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
