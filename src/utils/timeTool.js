
const millsInOneDay = 3600*24*1000  // 一天的毫秒数
const secondsInOneDay = 3600*24 // 一天的秒数
const SEC_PER_MIN = 60 // 一分钟的秒数
const tagMapping = ['day.yesterday','day.today','day.tomorrow']
const dayMapping = ['day.sunday','day.monday','day.tuesday','day.wednesday','day.thursday','day.friday','day.saturday']
import { i18n } from '@/i18n/index';

/**
 * 将js Date对象转换为YYYY-MM-dd字符串
 * 传入Date对象
 * */
const ymdFormat=(date)=>{
    return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate()
}

/**
 * 将js Date转成0点的时间戳(秒)
 * 传入任意date对象
 * */
const getZeroTimestamp = (date)=>{
    let str = ymdFormat(date)
    return new Date(str.replaceAll('-', '/')).getTime()/1000 // 兼容ios，ios不能解析-分隔的字符串！
}

/**
 * 两date之差，单位：天
 * 传入：第一个date-第二个date，不一定要0点的
 * */
const twoDayDiff = (day1,day2)=>{
    const day1Zero = getZeroTimestamp(day1)
    const day2Zero = getZeroTimestamp(day2)

    return Math.trunc((day1Zero-day2Zero) / secondsInOneDay)
}




/**
 * 处理8:00AM-9:00PM
 * 传入字符串，返回一个[a,b]数组
 * */
const calcTime = (str)=>{
    let hr = parseInt(str.substring(0,2)) // 一定要写0，否则会从2开始到末尾
    let min = parseInt(str.substring(3,5))
    let res = hr + min/60
    if(str.indexOf('PM')!==-1 && hr!==12) res+=12
    return res
}
// 处理08:00 AM
const calcTimeSpace = (str)=>{
    let time = str.split(' ')[0] // 08:00
    let hr = parseInt(time.split(':')[0])
    let min = parseInt(time.split(':')[1])
    let res = hr + min/60

    if(str.indexOf('PM')!==-1 && hr!==12) res+=12
    return res
}

const calcTimeSpaceStr = (str)=>{
    let time = str.split(' ')[0] // 08:00
    let hr = parseInt(time.split(':')[0])
    let min = parseInt(time.split(':')[1])

    if(str.indexOf('PM')!==-1 && hr!==12) hr+=12
    if(hr<10) hr = '0'+hr
    if(min<10) min = '0'+min

    return hr+":"+min
}

const begEndTime = (duration)=>{
    const t1 = calcTime(duration.split('-')[0])
    const t2 = calcTime(duration.split('-')[1])
    return [t1,t2]
}

/**
 * 生成时间序列
 * 传入lb,ub(小时) 返回数组，闭区间
 * */
const generateTimeSequence=(lb,ub)=>{
    let hrArray = []
    for(let i=lb;i<=ub;i++) hrArray.push(i)
    return hrArray
}

/**
 * 24小时制转HH:mm
 * 传入小时值（如9.5），返回09:30
 * */
const hourFormat=(hr)=>{
    const h = Math.floor(hr) // 9
    const m = (hr-h)*60 // 30

    let hh = h<10 ? '0'+h:''+h
    let mm = m<10 ? '0'+m:''+m

    return hh+":"+mm
}

/**
 * 时间戳（s）转HH:mm
 * 传入时间戳(s)，返回09:30
 * */
const timestampHourFormat=(ts)=>{

    const date = new Date(ts*1000)

    const h = date.getHours()
    const m = date.getMinutes()

    let hh = h<10 ? '0'+h:''+h
    let mm = m<10 ? '0'+m:''+m

    return hh+":"+mm
}

/**
 * 计算一天内两时间之差
 * 传入两个浮点数（从小到大），返回“1小时30分钟”这样的字符串
 * */
const hrDiff=(leftHr,rightHr)=>{
    const hrFloat = rightHr - leftHr

    const hrInt = Math.trunc(hrFloat)
    const hrFrac = hrFloat - hrInt

    let res = ''
    if(hrInt>0) res += hrInt + i18n.global.t(hrInt>1?'time.hours':'time.hour')
    if(hrFrac>0) res += hrFrac*60 + i18n.global.t(hrInt>1?'time.minutes':'time.minute')

    return res
}

/**
 * 计算一天内两时间戳之差
 * 传入两个时间戳(s)，返回“1小时30分钟”这样的字符串
 * */
const timestampDiff=(ts1,ts2)=>{

    const hrFloat = (ts2 - ts1)/3600

    console.log(hrFloat)

    const hrInt = Math.trunc(hrFloat)
    const hrFrac = hrFloat - hrInt

    let res = ''
    if(hrInt>0) res += hrInt + i18n.global.t(hrInt>1?'time.hours':'time.hour')
    if(hrFrac>0) res += hrFrac*60 + i18n.global.t(hrInt>1?'time.minutes':'time.minute')

    return res
}




/**
 * 将一个单日内的小时浮点数转为时间戳
 * 传入：当天date(不一定要0点时间)，小时浮点数
 * 返回时间戳（秒）
 * */
const hrToTimestamp = (date,hr)=>{
    const secondsDate = getZeroTimestamp(date)

    const secondsHr = hr * 60 * 60 // 小时秒数


    return secondsDate+secondsHr
}

/**
 * 将时间戳转为小时浮点数
 * 传入：时间戳(s)
 * 返回：小时浮点数,如9.5
 * */
const timestampToHr = (ts)=>{

    const date = new Date(ts*1000)

    return date.getHours()+date.getMinutes()/60
}

/**
 * 某date的显示字段
 * 不一定要0时的
 * */
const dayTag = (date)=>{
    let text = dayMapping[date.getDay()]
    let d = twoDayDiff(date,new Date()) // 与今天之差
    if(d>=-1&&d<=1){
        text = tagMapping[d+1]
    }

    return text
}

/**
 * 获取某个date最近的后一个半点
 * */
const getNearestNextHalf = (date)=>{
    let mm = date.getMinutes()
    let hh = date.getHours()


    if(mm<=30) return hh+0.5
    return hh+1
}

/**
 * 获取某个date最近的后一个scale
 * */
const getNearestNextTime = (date,scale)=>{

    if(scale<=0||scale>60) return

    let mm = date.getMinutes()
    let hh = date.getHours()

    let division = Math.trunc(mm / scale)

    return hh + (division+1) * scale / 60
}

/**
 * 判断浮点数最近的刻度
 * 输入一个浮点数，lb，ub, scale(30,15等)
 * 返回一个新的浮点数
 * */
function getNearestScale(fl,lb,ub,scale){


    const int = Math.trunc(fl);

    // console.log(fl)

    if(int<lb) return lb // 等于9的肯定是对的
    if(int>=ub) return ub // 大于等于18的肯定是错的

    const frac = fl - int; // 小数部分
    const scaleFrac = scale / 60 // 第一分位点

    const quanTile1 = Math.trunc(frac / scaleFrac) * scaleFrac
    const quanTile2 = (Math.trunc(frac / scaleFrac) + 1) * scaleFrac

    if(Math.abs(frac - quanTile1) <= Math.abs(frac - quanTile2)) return int + quanTile1
    return int + quanTile2
}

export {
    millsInOneDay,
    secondsInOneDay,
    SEC_PER_MIN,
    begEndTime,
    generateTimeSequence,
    hourFormat,
    ymdFormat,
    hrDiff,
    twoDayDiff,
    getZeroTimestamp,
    hrToTimestamp,
    dayTag,
    getNearestNextHalf,
    getNearestNextTime,
    timestampDiff,
    timestampHourFormat,
    timestampToHr,
    calcTimeSpace,
    calcTimeSpaceStr,
    getNearestScale
}