/** @module MeetingQueryApi */

import Request from '@/utils/request';
import dayjs from "dayjs";
import _ from 'lodash'

let request = new Request().http

/**
 * @private
 * @function
 * @author Octene
 * @description 获取所有会议
 * @param {Object} query
 * */
export function getAllMeetingsApi(query) {
    return request({
        url: '/call.php?act=get_info%2Findex',
        method: 'post',
        data: query,
    })
}


//================包装函数================

/**
 * @function
 * @author Octene
 * @param {Date} [day = new Date()] 当天日期
 * @description 获取某一天的所有会议
 * @returns {Object} 返回结果
*/
const wrappedGetMeetings = (day = new Date())=>{
	
	const dayObj = dayjs(day)
	
	const temp = {
	  end_time: dayObj.endOf('day').unix(),
	  start_time: dayObj.startOf('day').unix(),
	  timezone: "Asia/Shanghai",
	  id: "",
	  type: "all"
	}
	
	return new Promise((resolve, reject)=>{
	  getAllMeetingsApi(temp)
	    .then(data => {
	      resolve(data)
	    })
	    .catch(err => {
	      reject(err)
	    })
	})
}

/**
 * @function
 * @author Octene
 * @param {Date} day 当天日期
 * @param {Number} room_id 房间id
 * @description 获取某个房间某一天的所有会议
 * @returns {Object} 返回结果
*/
const wrappedGetMeetingsByRoomId = (day, room_id)=>{
	
	const dayObj = dayjs(day)
	
	const temp = {
	  end_time: dayObj.endOf('day').unix(),
	  start_time: dayObj.startOf('day').unix(),
	  timezone: "Asia/Shanghai",
	  id: "",
	  type: "all"
	}
	
	return new Promise((resolve, reject)=>{
	  getAllMeetingsApi(temp)
	    .then(data => {
			
		  let area = null
		  let room = null
		  const timestamp = data.timestamp
		  
		  _.forEach(data.areas,(a)=>{
			  _.forEach(a.rooms,(r)=>{
				  if(r.room_id==room_id){
					  area = a
					  room = r
					  return false
				  }
			  })
		  })
			
	      resolve({area,room,timestamp})
	    })
	    .catch(err => {
	      reject(err.message)
	    })
	})
}

export {
	wrappedGetMeetings,
	wrappedGetMeetingsByRoomId,
	request
}