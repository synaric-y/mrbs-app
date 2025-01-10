/**
 * @author Octene
 * @file 给定数组及一个点位，寻找上一个较小值/下一个较大值
*/

/** @module Timeline */

import _ from 'lodash'

/**
 * @function
 * @author Octene
 * @description 下一个较大值
 * @param {Entry[]} arr 会议数组
 * @param {Number} target 当前点位
 * @param {Number} lb 时间下界（含），时间戳
 * @param {Number} ub 时间上界（含），时间戳
 * @returns {Number} 当前点位的下一个较大值
*/
export function findNextLargerTime(arr,target,lb,ub){
	for(let i=0;i<arr.length;i++){
		if(arr[i].start_time>=target) return arr[i].start_time
	}
	return ub
}

/**
 * @function
 * @author Octene
 * @description 上一个较小值
 * @param {Entry[]} arr 会议数组
 * @param {Number} target 当前点位
 * @param {Number} lb 时间下界（含），时间戳
 * @param {Number} ub 时间上界（含），时间戳
 * @returns {Number} 当前点位的上一个较小值
*/
export function findPreviousSmallerTime(arr,target,lb,ub){
	
	// 排序，按每个会议结束时间（防止找到错误的最小值）
	const tempArr = _.sortBy(arr,['end_time'])
	
	// console.log(arr);
	for(let i = tempArr.length-1;i>=0;i--){
		if(arr[i].end_time<=target) return tempArr[i].end_time
	}
	return lb
}