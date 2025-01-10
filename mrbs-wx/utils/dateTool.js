/** @module DateTime */

/**
 * @author Octene
 * @file 处理日期转换
*/


import {
	MONDAY,
	TUESDAY,
	WEDNESDAY,
	THURSDAY,
	FRIDAY,
	SATURDAY,
	SUNDAY,
	YESTERDAY,
	TODAY,
	TOMORROW
} from '@/constants/i18n.js'

import dayjs from 'dayjs'

/**
 * @constant
 * @type {Array}
*/
const WEEK_LIST = [{
		label: MONDAY,
		value: '1'
	},
	{
		label: TUESDAY,
		value: '2'
	},
	{
		label: WEDNESDAY,
		value: '3'
	},
	{
		label: THURSDAY,
		value: '4'
	},
	{
		label: FRIDAY,
		value: '5'
	},
	{
		label: SATURDAY,
		value: '6'
	},
	{
		label: SUNDAY,
		value: '0'
	},
]

const WEEK_MAPPING = [
	SUNDAY, // 0
	MONDAY, // 1
	TUESDAY,
	WEDNESDAY,
	THURSDAY,
	FRIDAY,
	SATURDAY,
]

const DAY_MAPPING = [
	YESTERDAY, // 0
	TODAY,
	TOMORROW
]


/**
 * @function
 * @author Octene
 * @description js日期对象转换为相对今天的自然语言
 * @param {Date} val 需要转换的日期
 * @param {Number} [ts = dayjs().unix()] 当前时间戳
 * @returns {String} 日期的自然语言表示 '今天'|'明天'|'周日'...'周六'
*/
const dayText = (val, ts=dayjs().unix())=>{
	
	// console.log(val,ts);
	
	const dayObj1 = dayjs.unix(ts).startOf('d')
	const dayObj2 = dayjs(val).startOf('d')
	
	const diff_1 = dayObj2.diff(dayObj1, 'd') + 1 // 0,1,2
	
	if(diff_1>=0 && diff_1<=2) return DAY_MAPPING[diff_1] // 昨天今天明天

    return WEEK_MAPPING[dayObj2.day()] //周日-周六
}

/**
 * @function
 * @author Octene
 * @description 时间戳转换为相对今天的自然语言
 * @param {Number} val 需要转换的时间戳
 * @param {Number} [ts = dayjs().unix()] 当前时间戳
 * @returns {String} 时间戳的自然语言表示 '今天'|'明天'|'周日'...'周六'
*/
const dayTextTs = (val, ts=dayjs().unix())=>{
	
	// console.log(val,ts);
	
	const dayObj1 = dayjs.unix(ts).startOf('d')
	const dayObj2 = dayjs.unix(val).startOf('d')
	
	const diff_1 = dayObj2.diff(dayObj1, 'd') + 1 // 0,1,2
	
	
	if(diff_1>=0 && diff_1<=2) return DAY_MAPPING[diff_1] // 昨天今天明天

    return WEEK_MAPPING[dayObj2.day()] //周日-周六
}

/**
 * @typedef DateItem
 * @type {Object}
 * @property {String} text 日期的自然语言表示
 * @property {Date} date jsDate对象
*/

/**
 * @function
 * @author Octene
 * @description 生成从今天开始的，长度为length的日期列表
 * @param {Number} length 列表长度
 * @param {Number} [ts = dayjs().unix()] 当前时间戳
 * @returns {DateItem[]} 日期列表
*/
const getDateListOfNLength = (length, ts=dayjs().unix()) => {

	let res = []

	// 计算之后的14天
	for (let i = 0; i < length; i++) {
		let temp = dayjs().add(i, 'd').toDate()
		
		// console.log(temp);

		res.push({
			text: dayText(temp,ts),
			date: temp,
		})
	}
	
	return res
}

/**
 * @function
 * @author Octene
 * @description jsDate转换为年月日
 * @param {Date} val 待转换的日期
 * @returns {String} YYYY-MM-DD
*/
const ymdFormat = (val) => {
	return dayjs(val).format('YYYY-MM-DD')
}

/**
 * @function
 * @author Octene
 * @description 时间戳转换为年月日
 * @param {Number} val 待转换的时间戳
 * @returns {String} YYYY-MM-DD
*/
const ymdFormatTs = (val) => {
	return dayjs.unix(val).format('YYYY-MM-DD')
}


export {
	WEEK_LIST,
	dayText,
	dayTextTs,
	getDateListOfNLength,
	ymdFormat,
	ymdFormatTs
}