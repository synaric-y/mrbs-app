/** @module UI */

/**
 * @author Octene
 * @file 路由跳转
*/

import _ from 'lodash'


/**
 * @function
 * @author Octene
 * @description 返回首页
*/
const returnToIndex = () => {
	uni.navigateTo({
		url: `../index/index` // 以实际执行文件所在的位置为准
	})
}


/**
 * @function
 * @author Octene
 * @description 返回首页
 * @param {String} 前往的地址，如'../index/index'，以函数执行的文件的位置为准，计算相对路径
 * @param {Object} 跳转时携带的参数，会被转换为get参数模式
*/
const gotoPage = (url, params) => {
	
	
	if(!params || params==[]){
		uni.navigateTo({
			url: url
		});
		return
	}
	
	let kvArr = []
	_.forEach(params, function(value, key) {
	  kvArr.push(key+'='+value)
	});
	
	uni.navigateTo({
		url: url+'?'+kvArr.join('&')
	});
}

/**
 * @function
 * @author Octene
 * @description 返回首页
 * @param {String} 前往的地址，如'../index/index'，以函数执行的文件的位置为准，计算相对路径
 * @param {Object} 跳转时携带的参数，会被转换为get参数模式
*/
const redirectTo = (url, params) => {
	
	
	if(!params || params==[]){
		uni.redirectTo({
			url: url
		});
		return
	}
	
	let kvArr = []
	_.forEach(params, function(value, key) {
	  kvArr.push(key+'='+value)
	});
	
	uni.redirectTo({
		url: url+'?'+kvArr.join('&')
	});
}

/**
 * @function
 * @author Octene
 * @description 返回上一级
*/
const navigateBack = ()=>{
	uni.navigateBack()
}

export {
	returnToIndex,
	gotoPage,
	redirectTo,
	navigateBack
}