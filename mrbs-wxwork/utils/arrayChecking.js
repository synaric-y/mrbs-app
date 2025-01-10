/**
 * @author Octene
 * @file 传入Entry数组和两个手柄，判断手柄是否和数组中某个entry冲突
*/

/** @module Timeline */

import _ from 'lodash'

/**
 * @typedef Entry
 * @type {Object} 
 * @property {Number} start_time 开始时间戳
 * @property {Number} end_time 结束时间戳
 */

/**
 * @function
 * @author Octene
 * @description 检查左值是否合法
 * @param {Number} left 左值
 * @param {Entry[]} arr 会议数组
 * @param {Number} lb 时间下界（含），时间戳
 * @returns {Boolean} 左值是否合法
*/
const isLeftHandleValid = (left,arr,lb) => {
  if (left < lb) return false // 检查是否越界
  
  return _.every(arr, (item)=>{return !(left >= item.start_time && left < item.end_time)});
}

/**
 * @function
 * @author Octene
 * @description 检查右值是否合法
 * @param {Number} right 右值
 * @param {Entry[]} arr 会议数组
 * @param {Number} ub 时间上界（含），时间戳
 * @returns {Boolean} 右值是否合法
*/
const isRightHandleValid = (right,arr,ub) => {
  if (right > ub) return false // 检查是否越界
  
  return _.every(arr, (item)=>{return !(right > item.start_time && right <= item.end_time)});
}

/**
 * @function
 * @author Octene
 * @description 检查两手柄之间是否有会议
 * @param {Number} left 左值
 * @param {Number} right 右值
 * @param {Entry[]} arr 会议数组
 * @returns {Boolean} 两手柄之间无会议返回true
*/
const isBothValid = (left, right, arr) => {
  return _.every(arr, (item)=>{return !(left <= item.start_time && right >= item.end_time)});
}


/**
 * @function
 * @author Octene
 * @description 检查两手柄之间的关系
 * @param {Number} left 左值
 * @param {Number} right 右值
 * @param {Number} resolution 最小间隔，时间戳
 * @returns {Boolean} 左手柄严格小于右手柄，差值大于等于最小间隔，返回true
*/
const isCorrectOrder = (left, right, resolution) => {
  return (right > left) && (right - left >= resolution)
}


/**
 * @function
 * @author Octene
 * @description 全部检查
 * @param {Number} left 左值
 * @param {Number} right 右值
 * @param {Entry[]} arr 会议数组
 * @param {Number} lb 时间下界（含），时间戳
 * @param {Number} ub 时间上界（含），时间戳
 * @param {Number} resolution 最小间隔，时间戳
 * @returns {Boolean} 全部检查完成返回true
*/
const fullCheck = (left, right, arr, lb, ub, resolution) => {
  return isLeftHandleValid(left,arr,lb) &&
      isRightHandleValid(right,arr,ub) &&
      isBothValid(left, right, arr) &&
      isCorrectOrder(left, right, resolution)
}

export {
	isLeftHandleValid,
	isRightHandleValid,
	isBothValid,
	isCorrectOrder,
	fullCheck
}