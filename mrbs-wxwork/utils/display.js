/** @module UI */

/**
 * @author Octene
 * @file 用户操作反馈
*/

import {i18n} from '@/i18n/index.js'

/**
 * @function
 * @author Octene
 * @description 显示轻提示
 * @param {String} txt 内容
 * @param {Number} [duration=1500] 持续时间
*/
export function showToast(txt,duration=1500){
	uni.showToast({
		title:txt,
		icon:'none',
		duration: duration
	})
}

/**
 * @function
 * @author Octene
 * @description 显示模态框，有确认和取消按钮，点击确认按钮后触发回调函数
 * @param {String} content 内容
 * @param {Function} func 成功的回调函数
 * @param {String} [title=i18n.global.t('common.model_title')] 标题（可选）
*/
export function showModal(content,func,title=i18n.global.t('common.model_title')){
	uni.showModal({
		title: title,
		content: content,
		confirmColor: '#591BB7',
		success: function (res) {
			if (res.confirm) {
				func()
			}
		}
	});
}