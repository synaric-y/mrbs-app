import request from '@/utils/request';
import axios from 'axios';
import dayjs from "dayjs";



/*
* /call.php?act=get_info%2Findex
/call.php?act=get_info%2Fget_all_rooms
/call.php?act=get_info%2Fget_entry_by_creator
/call.php?act=get_info%2Fget_entry_by_id
/call.php?act=entry%2Fdel_entry
/call.php?act=entry%2Fedit_entry_handler
* */

/**
 * 获取区域列表
 * @param query
 */
export function getAreaListApi(query) {
    return request({
        url: '/call.php?act=get_info%2Findex',
        method: 'post',
        data: query,
    })
}

/**
 * 所有会议
 * @param query
 */
export function getAllMeetingsApi(query) {
    return request({
        url: '/call.php?act=get_info%2Findex',
        method: 'post',
        data: query,
    })
}

/**
 * 一个房间内的所有会议
 * @param currentDate 当前js时间对象
 * @param id 房间id
 */
export function getAllMeetingsByRoomApi(currentDate,id) {

    const dayObj = dayjs(currentDate || new Date())

    const today = dayObj.startOf('day').unix()
    const todayEnd = dayObj.endOf('day').unix()

    return request({
        url: '/call.php?act=get_info%2Findex',
        method: 'post',
        data: {
            end_time: todayEnd,
            start_time: today,
            timezone: "Asia/Shanghai",
            id: id,
            type: "all"
        },
    })
}

/**
 * 获取区域列表（无条件，不含会议信息）
 * @param query
 */
export function getAllRoomsApi(query) {
    return request({
        url: '/call.php?act=get_info%2Fget_all_rooms',
        method: 'post',
        data: query,
    })
}

/**
 * 获取单个区域
 * @param query
 */
export function getAreaDetailApi(query) {
    return request({
        url: '/call.php?act=get_info%2Fget_all_rooms',
        method: 'post',
        data: {
            "end_time": 1730908799,
            "start_time": 1730822400,
            "timezone": "Asia/Shanghai",
            "id": "20",
            "type": "area",
            ...query
        }
    })
}




/**
 * 测试
 * */


/**
 * 预订会议
 * @method POST
 * @param room_id 房间号
 * @param start_time 开始时间戳
 * @param end_time 结束时间戳
 * @param name 会议主题
 */
export function bookMeetingApi(query) {
    return request({
        url: '/appapi/wxwork_book_meeting.php',
        method: 'post',
        data: query,
    })
}

// 测试用
export function loginApi(query){
    return request({
        url: '/login.php',
        method: 'post',
        data: query,
    })
}

/**
 * 企业微信登录后台api
 * @param code 前台回调之后得到的code
 * */
export function wxLoginApi(code) {
    return request({
        url: '/wxwork_login.php?code='+code,
        method: 'get',
    })
}

/**
 * 接收拼接url
 * */
export function wxOauth2Url() {
    return request({
        url: '/wxwork_login_url.php',
        method: 'post',
    })
}

/**
 * 我的
 * */
export function getMeetingsByCreatorApi(data) {
    return request({
        url: '/call.php?act=get_info%2Fget_entry_by_creator',
        method: 'post',
        data:{
            "type":'all',
            "pagesize": 20,
            "pagenum": 1,
            ...data
        }
    })
}

/**
 * 特定id会议
 * */
export function getMeetingByIdApi(query) {
    return request({
        url: '/call.php?act=get_info%2Fget_entry_by_id',
        method: 'post',
        data: {...query, is_series: 0},
    })
}

/**
 * 取消会议
 * */
export function cancelMeetingByIdApi(query) {
    return request({
        url: '/call.php?act=entry%2Fdel_entry',
        method: 'post',
        data: query,
    })
}

/**
 * 编辑会议
 * */
export function editMeetingByIdApi(query) {
    return request({
        url: '/call.php?act=entry%2Fedit_entry_handler',
        method: 'post',
        data: query,
    })
}
