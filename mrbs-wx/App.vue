<script>
	
	export default {

		onLaunch: function() {
			
			
			
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