/** @module MeetingOperApi */

import {request} from './index.js';
import dayjs from "dayjs";
import _ from 'lodash'

/**
 * @private
 * @function
 * @author Octene
 * @description 编辑/新增单次/循环会议
 * @param {Object} query
 * */
export function editMeetingByIdApi(query) {
    return request({
        url: '/call.php?act=entry%2Fedit_entry_handler',
        method: 'post',
        data:
        {
        "area_id": 20,
        "area_name": "shanghai",
        "room_id": 18,
        "room_name": "TestA",
        "rooms": [
            18
        ],
        "name": "小小王的会",
        "start_date": "2024-11-13",
        "start_hour": "19:30",
        "start_seconds": 1731497400,
        "end_date": "2024-11-13",
        "end_hour": "19:45",
        "end_seconds": 1731498300,
        "description": "",
        "repeat_week": "1",
        "check_list": [],
        "rep_end_date": "",
        "all_day": "",
        "type": "E",
        "original_room_id": 18,
        "ical_uid": "1123123",
        "ical_sequence": 1,
        "ical_recur_id": "asdfa",
        "allow_registration": "",
        "registrant_limit": 10,
        "registrant_limit_enabled": "1",
        "registration_opens_value": 1,
        "registration_open_units": "w",
        "registration_open_enabled": "",
        "registration_closes_value": 1,
        "registration_closes_units": "w",
        "registration_closes_enabled": "",
        "rep_id": null,
        "edit_series": 0,
        "rep_type": 0,
        "rep_day": [],
        "rep_interval": 1,
        "month_type": 0,
        "month_absolute": 2,
        "month_relative_ord": "",
        "month_relative_day": "",
        "skip": 0,
        "no_mail": 1,
        "private": "",
        ...query
        },
    })
}


/**
 * @private
 * @function
 * @author Octene
 * @description 取消会议
 * @param {Object} query
 * */
export function cancelMeetingByIdApi(query) {
    return request({
        url: '/call.php?act=entry%2Fdel_entry',
        method: 'post',
        data: query,
    })
}

/**
 * @private
 * @function
 * @author Octene
 * @description 提前结束会议
 * @param {Object} query
 * */
export function forceEndMeetingByIdApi(query) {
    return request({
        url: '/call.php?act=entry%2Fforce_end_entry',
        method: 'post',
        data: query,
    })
}

/**
 * @private
 * @function
 * @author Octene
 * @description 查询特定id的会议
 * @param {Object} query
 * */
export function getMeetingByIdApi(query) {
    return request({
        url: '/call.php?act=get_info%2Fget_entry_by_id',
        method: 'post',
        data: {is_series: 0,...query},
    })
}

//================工具函数================

function testNumber(val){ // 判断是否为纯数字
	const str = /^[0-9]+$/
	const reg = new RegExp(str)
	return reg.test(val)
}

function convertToBinaryWithSundayLeft(rep_day){
	let binaryArray = new Array(7).fill('0');

	rep_day.forEach(value => {
		binaryArray[parseInt(value)] = 1;
	});
	return binaryArray.join('');
}


//================包装函数================

/**
 * @function
 * @author Octene
 * @description 查询特定id的会议
 * @param {Number} id 会议id，如果是循环会议则是repeat_id
 * @param {Boolean} isSeries 查询的是否为循环会议
*/
const wrappedGetMeetingById = (entryId,isSeries)=>{
	const temp = {
	  is_series: isSeries?1:0,
	  id: entryId,
	}
	
	return new Promise((resolve, reject)=>{
	  getMeetingByIdApi(temp)
	    .then(data => {
	      resolve(data)
	    })
	    .catch(err => {
	      reject(err.message)
	    })
	})
}

/**
 * @function
 * @author Octene
 * @description 取消会议
 * @param {Number} id 会议id（不是repeat_id）
 * @param {Boolean} isSeries 取消的是否为循环会议
*/
const wrappedCancelMeetingById = (entryId,isSeries)=>{
	const temp = {
	  entry_series: isSeries?1:0,
	  entry_id: entryId
	}
	
	return new Promise((resolve, reject)=>{
	  cancelMeetingByIdApi(temp)
	    .then(data => {
			
	      resolve(data)
	    })
	    .catch(err => {
	      reject(err.message)
	    })
	})
}


/**
 * @function
 * @author Octene
 * @description 预定单次会议
 * @param {Number} area_id 区域id
 * @param {String} area_name 区域名称
 * @param {Number} room_id 房间id
 * @param {String} room_name 房间名称
 * @param {Number} capacity 房间容量（非负）
 * @param {String} topic 会议主题
 * @param {Number} start_ts 起始时间戳（s）
 * @param {Number} end_ts 结束时间戳（s）
*/
const wrappedReserveSingleMeeting = (area_id,area_name,room_id,room_name,capacity,topic,start_ts,end_ts)=>{
	
	const startObj = dayjs.unix(start_ts)
	const endObj = dayjs.unix(end_ts)
	
	const temp = {
		"area_id": area_id,
		"area_name": area_name,
		"room_id": room_id,
		"room_name": room_name,
		"rooms": [
			room_id
		],
		"name": testNumber(topic) ? ('"' + topic + '"') : topic,
		"start_date": startObj.format("YYYY-MM-DD"),
		"start_hour": startObj.format("HH:mm"),
		"start_seconds": start_ts,
		"end_date": endObj.format("YYYY-MM-DD"),
		"end_hour": endObj.format("HH:mm"),
		"end_seconds": end_ts,
		"original_room_id": room_id,
		"registrant_limit": capacity
	}
	
	return new Promise((resolve, reject)=>{
	  editMeetingByIdApi(temp)
	    .then(data => {
			
	      resolve(data)
	    })
	    .catch(err => {
	      reject(err.message)
	    })
	})
}

/**
 * @function
 * @author Octene
 * @description 预定循环会议
 * @param {Number} area_id 区域id
 * @param {String} area_name 区域名称
 * @param {Number} room_id 房间id
 * @param {String} room_name 房间名称
 * @param {Number} capacity 房间容量（非负）
 * @param {String} topic 会议主题
 * @param {Number} start_ts 起始时间戳（s）
 * @param {Number} end_ts 结束时间戳（s）
 * @param {String} rep_end_date 循环结束日期（YYYY-MM-DD）
 * @param {String[]} rep_day 循环模式，每项在0~6之间（["4","0","1"]）
 * @param {Number} rep_interval 间隔天数（1~4）
*/
const wrappedReserveRepeatedMeeting = (area_id,area_name,room_id,room_name,capacity,topic,start_ts,end_ts,rep_end_date,rep_day,rep_interval)=>{
	
	const startObj = dayjs.unix(start_ts)
	const endObj = dayjs.unix(end_ts)
	
	
	const temp = {
		"area_id": area_id,
		"area_name": area_name,
		"room_id": room_id,
		"room_name": room_name,
		"rooms": [
			room_id
		],
		"name": testNumber(topic) ? ('"' + topic + '"') : topic,
		"start_date": startObj.format("YYYY-MM-DD"),
		"start_hour": startObj.format("HH:mm"),
		"start_seconds": start_ts,
		"end_date": endObj.format("YYYY-MM-DD"),
		"end_hour": endObj.format("HH:mm"),
		"end_seconds": end_ts,
		"rep_end_date": rep_end_date,
		"original_room_id": room_id,
		"registrant_limit": capacity,
		"edit_series": 1, // 决定循环会议
		"rep_day": rep_day,
		"rep_interval": rep_interval,
		"rep_opt": convertToBinaryWithSundayLeft(rep_day),
		"rep_type": 2,
	}
	
	return new Promise((resolve, reject)=>{
	  editMeetingByIdApi(temp)
	    .then(data => {
		
			
	      resolve(data)
	    })
	    .catch(err => {
	      reject(err.message)
	    })
	})
}

/**
 * @function
 * @author Octene
 * @description 编辑单次会议
 * @param {Number} entry_id 会议id
 * @param {Number} area_id 区域id
 * @param {String} area_name 区域名称
 * @param {Number} room_id 房间id
 * @param {String} room_name 房间名称
 * @param {Number} capacity 房间容量（非负）
 * @param {String} topic 会议主题
 * @param {Number} start_ts 起始时间戳（s）
 * @param {Number} end_ts 结束时间戳（s）
*/
const wrappedEditSingleMeeting = (entry_id,area_id,area_name,room_id,room_name,capacity,topic,start_ts,end_ts)=>{

	const startObj = dayjs.unix(start_ts)
	const endObj = dayjs.unix(end_ts)

	const temp = {
		"id": entry_id,
		"area_id": area_id,
		"area_name": area_name,
		"room_id": room_id,
		"room_name": room_name,
		"rooms": [
			room_id
		],
		"name": testNumber(topic) ? ('"' + topic + '"') : topic,
		"start_date": startObj.format("YYYY-MM-DD"),
		"start_hour": startObj.format("HH:mm"),
		"start_seconds": start_ts,
		"end_date": endObj.format("YYYY-MM-DD"),
		"end_hour": endObj.format("HH:mm"),
		"end_seconds": end_ts,
		"original_room_id": room_id,
		"registrant_limit": capacity
	}
	
	
	return new Promise((resolve, reject)=>{
	  editMeetingByIdApi(temp)
	    .then(data => {
			
			
	      resolve(data)
	    })
	    .catch(err => {
	      reject(err.message)
	    })
	})
}


/**
 * @function
 * @author Octene
 * @description 编辑循环会议
 * @param {Number} entry_id 会议id
 * @param {Number} repeat_id 循环会议repeat_id
 * @param {Number} area_id 区域id
 * @param {String} area_name 区域名称
 * @param {Number} room_id 房间id
 * @param {String} room_name 房间名称
 * @param {Number} capacity 房间容量（非负）
 * @param {String} topic 会议主题
 * @param {String} start_date 起始日期（YYYY-MM-DD）
 * @param {String} time1 会议开始时间（HH:mm）
 * @param {String} time2 会议结束时间（HH:mm）
 * @param {String} end_date 结束日期（YYYY-MM-DD）
 * @param {String[]} rep_day 循环模式，每项在0~6之间（["4","0","1"]）
 * @param {Number} rep_interval 间隔天数（1~4）
*/
const wrappedEditRepeatedMeeting = (entry_id,repeat_id,area_id,area_name,room_id,room_name,capacity,topic,start_date,time1,time2,end_date,rep_day,rep_interval)=>{

	const temp = {
		"area_id": area_id,
		"area_name": area_name,
		"room_id": room_id,
		"room_name": room_name,
		"rooms": [
			room_id
		],
		"name": testNumber(topic) ? ('"' + topic + '"') : topic,
		"start_date": start_date,
		"start_hour": time1,
		"start_seconds": dayjs(start_date + ' ' + time1, 'YYYY-MM-DD HH:mm').unix(),
		"end_date": start_date,
		"end_hour": time2,
		"end_seconds": dayjs(start_date + ' ' + time2,'YYYY-MM-DD HH:mm').unix(),
		"rep_end_date": end_date,
		"original_room_id": room_id,
		"tmp_repeat_id": repeat_id,
		"id": entry_id,
		"registrant_limit": capacity,
		"edit_series": 1, // 决定循环会议
		"rep_day": rep_day,
		"rep_interval": rep_interval,
		"rep_opt": convertToBinaryWithSundayLeft(rep_day),
		"rep_type": 2,
		"skip": 1 // 忽略冲突
	}
	
	return new Promise((resolve, reject)=>{
	  editMeetingByIdApi(temp)
	    .then(data => {
			
			
	      resolve(data)
	    })
	    .catch(err => {
	      reject(err.message)
	    })
	})
}

/**
 * @function
 * @author Octene
 * @description 提前结束会议
 * @param {Number} entry_id 会议id
*/
const wrappedForceEndMeetingById = (entry_id)=>{
	
	const temp = {
		"id": entry_id
	}
	
	return new Promise((resolve, reject)=>{
	  forceEndMeetingByIdApi(temp)
	    .then(data => {
			
			
	      resolve(data)
	    })
	    .catch(err => {
	      reject(err.message)
	    })
	})
	
}

export {
	wrappedGetMeetingById,
	wrappedCancelMeetingById,
	wrappedReserveSingleMeeting,
	wrappedReserveRepeatedMeeting,
	wrappedEditSingleMeeting,
	wrappedEditRepeatedMeeting,
	wrappedForceEndMeetingById
}