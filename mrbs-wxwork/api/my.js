/** @module MeetingQueryApi */

import request from '@/utils/request';

/**
 * @private
 * @author Octene
 * @description 我的
 * */
export function getMeetingsByCreatorApi(data) {
    return request({
        url: '/call.php?act=get_info%2Fget_entry_by_creator',
        method: 'post',
        data:{
            "pagesize": 10,
            "pagenum": 1,
            ...data
        }
    })
}


/**
 * @function
 * @author Octene
 * @description 分页获取当前用户的特定状态会议
 * @param {Number} pageNum 页码，1~100
 * @param {Number} status 状态，0/1/2（待开始/进行中/已结束）
 * @returns {Object[]} 会议列表
*/
const wrappedGetMeetingsByCreator = (pageNum, status)=>{
	
	const temp = {
		"pagesize": 10,
		"pagenum": pageNum,
		"status":status
	}
	
	return new Promise((resolve, reject)=>{
	  getMeetingsByCreatorApi(temp)
	    .then(({code,msg,data}) => {
			
		  if(code!=0) throw new Error(msg)
			
	      resolve(data)
	    })
	    .catch(err => {
	      reject(err.message)
	    })
	})
	
}

export {
	wrappedGetMeetingsByCreator
}