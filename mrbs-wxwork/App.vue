<script>
	export default {

		onLaunch: function() {
			//监听页面跳转变化
			let that = this;
			uni.addInterceptor('navigateTo', { //监听跳转
				success(e) {
					that.watchRouter();

				}
			})
			uni.addInterceptor('redirectTo', { //监听关闭本页面跳转
				success(e) {
					that.watchRouter();

				}
			})
			uni.addInterceptor('switchTab', { //监听tabBar跳转
				success(e) {
					that.watchRouter();

				}
			})
			uni.addInterceptor('navigateBack', { //监听返回
				success(e) {
					that.watchRouter();

				}
			})
		},
		methods: {
			watchRouter() {
				console.log('路由进行跳转');
			},
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
	/* 禁止选择文本(除了文本框、文本域之外) */
	div,view,span,label,h1,h2,h3,h4,h5,h6 { 
	    -webkit-touch-callout: none;
	    -webkit-user-select: none;
	    -khtml-user-select: none;
	    -moz-user-select: none;
	    -ms-user-select: none;
	    user-select: none;
	}
</style>