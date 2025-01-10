/** @module LoginApi */

import {request} from './index.js';

/**
 * 企业微信登录后台api
 * @param code 前台回调之后得到的code
 * */
export function wxLoginApi(code) {
    return request({
        url: '/call.php?act=wx_login',
        method: 'post',
		data:{
			code: code
		}
    })
}



/**
 * 接收拼接url
 * */
export function wxOauth2Url(area_id,room_id) {
    return request({
        url: '/wxwork_login_url.php',
        method: 'post',
		data: {
			area_id: area_id,
			room_id: room_id
		}
    })
}

export function wrappedWxOauth2Url(area_id,room_id) {
	
	if(!area_id || !room_id){
		return request({
		    url: '/wxwork_login_url.php',
		    method: 'post'
		})
	}else{
		return request({
		    url: '/wxwork_login_url.php',
		    method: 'post',
			data: {
				area_id: area_id,
				room_id: room_id
			}
		})
	}
}