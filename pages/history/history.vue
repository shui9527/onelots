<template>
  <view class="page">
    <!-- 历史页头部 -->
    <view class="header">
      <text class="title">历史记录</text>
      <text class="sub">历次求签 · 点击回看详情</text>
    </view>

    <!-- 历史列表（M1 骨架：空态；M5 接入 uni.setStorage history） -->
    <view class="list">
      <view v-if="isEmpty" class="empty">
        <text>暂无求签记录</text>
        <text class="empty-sub">求签后自动保存在本机</text>
      </view>
      <view v-else class="placeholder-note">
        <text>历史列表占位\n（M5 接入：分类 / 时间 / 结果摘要，点击看详情）</text>
      </view>
    </view>

    <!-- 返回首页 -->
    <view class="btn" @tap="backHome">
      <text>返回首页</text>
    </view>

    <!-- 底部占位说明 -->
    <view class="footer-tip">M1 页面骨架 · 历史页</view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// M5 阶段：读取 uni.getStorageSync('history') 渲染列表；上限 200 条裁剪
const isEmpty = ref(true)

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

.list {
  margin-top: 40rpx;
  padding: 48rpx 32rpx;
  border-radius: 24rpx;
  background: #fffdf8;
  box-shadow: 0 4rpx 16rpx rgba(122, 84, 40, 0.08);
  text-align: center;
}
.empty {
  font-size: 28rpx;
  color: #8a6b4a;
}
.empty-sub {
  display: block;
  margin-top: 12rpx;
  font-size: 22rpx;
  color: #b5a189;
}
.placeholder-note {
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
  background: #fffdf8;
  color: #4a2c17;
  border: 2rpx solid #d8c4a8;
  font-size: 30rpx;
  text-align: center;
}

.footer-tip {
  margin-top: 60rpx;
  text-align: center;
  font-size: 22rpx;
  color: #b5a189;
}
</style>
