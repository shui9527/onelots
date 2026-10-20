<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
			// 加载本地字体（App 端）：注册 MiSans 字体族
			uni.loadFontFace({
				family: 'MiSans',
				source: 'url("/static/fonts/MiSans-Regular.ttf")',
				global: true,
				success: () => console.log('MiSans loaded'),
				fail: (err) => console.log('MiSans load fail', err)
			})
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	/* 字体定义：H5/小程序端通过 @font-face 兜底，App 端由 uni.loadFontFace 注册 */
	@font-face {
		font-family: 'MiSans';
		src: url('~@/static/fonts/MiSans-Regular.ttf');
		font-weight: normal;
		font-display: swap;
	}

	/*每个页面公共css */
	page {
		font-family: 'MiSans', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
	}
</style>
