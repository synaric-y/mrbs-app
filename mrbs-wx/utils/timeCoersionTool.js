/** @module DateTime */

/**
 * @author Octene
 * @file 处理时间戳、小时浮点数与字符串的互相转换
*/

import {
	HOUR,
	HOURS,
	MINUTE,
	MINUTES,
	SECOND,
	SECONDS,
} from '@/constants/i18n'
import {
	SEC_PER_HOUR,
	SEC_PER_MINUTE
} from '../constants/time'
import {
	i18n
} from '@/i18n/index';
import {
	Decimal
} from 'decimal.js';
import dayjs from 'dayjs'



/**
 * @function
 * @author Octene
 * @description 时间戳转换为24小时制字符串
 * @param {Number} ts 时间戳
 * @return {String} 24小时制字符串，HH:mm
 * */
const ts2hhmm = (ts) => {
	return dayjs.unix(ts).format('HH:mm')
}


/**
 * @function
 * @author Octene
 * @description 计算两个时间戳的差值，并将差值转换为可读的字符串
 * @param {Number} begTs 较小的时间戳
 * @param {Number} endTs 较大的时间戳
 * @return {String} 最小单位为秒的字符串，如“1小时23分59秒”
 * */
const tsDiff2hms = (begTs, endTs) => {
	let tsDiff = Math.abs(endTs - begTs)


	const hr = Number(new Decimal(tsDiff).dividedBy(SEC_PER_HOUR).floor())
	const min = Number(new Decimal(tsDiff).minus(hr * SEC_PER_HOUR).dividedBy(SEC_PER_MINUTE).floor())
	const sec = Number(new Decimal(tsDiff).minus(hr * SEC_PER_HOUR).minus(min * SEC_PER_MINUTE).floor())

	// console.log(hr,min,tsDiff);

	let res = ''
	if (hr > 0) res += hr + (hr > 1 ? HOURS : HOUR)
	if (min > 0) res += min + (min > 1 ? MINUTES : MINUTE)
	if (sec > 0) res += sec + (sec > 1 ? SECONDS : SECOND)

	return res
}

/**
 * @function
 * @author Octene
 * @description 给定一个jsDate和一个小时浮点数，将其转换为时间戳
 * @param {Date} date 当天日期
 * @param {Number} hr 小时浮点数
 * @return {Number} 时间戳
 * */
const fl2ts = (date, hr) => {
	return dayjs(date).startOf('d').unix() + hr * SEC_PER_HOUR
}

/**
 * @function
 * @author Octene
 * @description 给定一个字符串，将其转换为小时浮点数
 * @param {String} str 格式为hh:mm A的字符串, 12小时制（如07:00 AM）
 * @return {Number} 小时浮点数
 * */
const hhmm2fl = (str) => {
	let time = str.split(' ')[0] // 08:00
	let hr = parseInt(time.split(':')[0])
	let min = parseInt(time.split(':')[1])
	let res = hr + min / 60

	if (str.indexOf('PM') !== -1 && hr !== 12) res += 12
	return res
}





export {
	ts2hhmm,
	tsDiff2hms,
	fl2ts,
	hhmm2fl
}