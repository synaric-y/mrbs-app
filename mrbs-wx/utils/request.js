import {
	HOST
} from '@/config/index.js'
// import store from '@/store'
import RequestManager from '@/utils/requestManager.js'
const manager = new RequestManager() //创建请求管理表
import {
	showToast
} from '@/utils/display.js'
import {
	i18n
} from '@/i18n/index.js'


export default class Request {
	/**
	 * @class
	 * @classdesc 创建一个请求实例，并发送uni请求
	 * @param {Object} param 构造参数
	 * @param {String} [param.host=HOST] 请求地址前缀，如无，默认使用全局请求地址
	 * @param {String} param.url 请求的具体接口
	 * @param {String} [param.method=POST] 请求方法，GET|POST，默认为POST
	 * @param {Object} [param.data={}] POST携带的body对象，默认为空
	 * @param {String} [param.token=''] token，默认为空
	 * @param {Object} [param.header={}] 请求头, 默认为空（最后会默认添加一项 'content-type': "application/json"）
	 * @param {Boolean} [param.hideLoading=false] 隐藏加载圈，默认为false，即不隐藏
	 */
	http(param) {

		// console.log(store.state);

		// 请求参数
		var host = param.host || HOST,
			url = param.url,
			method = param.method || "POST",
			data = param.data || {},
			token = param.token || "",
			header = {
				'content-type': "application/json",
				'cookie': uni.getStorageSync('cookie'),
				...param.header
			},
			hideLoading = param.hideLoading || false;

		// 拼接完整请求地址
		var requestUrl = host + url;

		// 请求方式: GET或POST
		
		
		console.log(method);
		
		if (method) {
		    method = method.toUpperCase(); //小写改为大写
			
			console.log(method);
			
		    if (method == "POST") {
		        
		    } else {
		        
		    }
		}

		let requestId = manager.generateId(method, url, data)
		if (!requestId) {
			console.log('重复请求')
			return false
		}

		//加载圈
		if (!hideLoading) {
			uni.showLoading({
				// title: i18n.global.t('message.loading')
				title: '加载中'
			});
		}

		// 返回promise
		return new Promise((resolve, reject) => {
			// 请求
			uni.request({
				url: requestUrl,
				data: data,
				method: method,
				header: header,
				success: (res) => {
					
					if(res.cookies && res.cookies[0]){ // 如果返回有cookie，就存cookie
						uni.setStorageSync('cookie',res.cookies[0])
					}
					
					

					const {
						code,
						data,
						msg
					} = res.data

					if (code != 0 && code != 200) {
						
						console.log(msg);

						switch (code) {
							case -101: { // token被顶下线
								// showToast(i18n.global.t('message.detail.please_login'))
								uni.redirectTo({
									url: '/pages/login/login'
								})
							}break;
							case -1: { // 参数有误
								showToast(msg)
							}break;
							default: {
								uni.showToast({
									title: "请求失败",
									icon: 'none'
								});
								reject(new Error(msg))
							}
						}



					}

					// 将data抛出
					console.log(data);
					resolve(data)
				},
				//请求失败
				fail: (e) => {
					uni.showToast({
						title: "请求失败",
						icon: 'none'
					});

					// 抛出错误
					reject(e);
				},
				//请求完成
				complete() {
					// 请求完成，清除当前请求的唯一ID
					manager.deleteById(requestId)
					//隐藏加载
					if (!hideLoading) {
						uni.hideLoading();
					}
					resolve();
					return;
				}
			})
		})
	}
}