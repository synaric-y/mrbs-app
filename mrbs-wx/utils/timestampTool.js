/** @module DateTime */

/**
 * @author Octene
 * @file 时间戳生成、查找
*/

import {Decimal} from 'decimal.js';


/**
 * @function
 * @author Octene
 * @description 寻找下一个整点(正好是0、15、30、45分钟的时间戳)
 * @param {Number} ts 当前点位
 * @param {Number} resolution 最小会议间隔，秒
 * @return {Number} 下一个整点时间戳（向上取整）
 * */
const ceilScaleTs=(ts,resolution)=>{
	
	if((Number)(new Decimal(ts).mod(resolution))==0) return ts

    let res = new Decimal(ts).dividedBy(resolution).floor().times(resolution).plus(resolution);

    // console.log(res);

    return Number(res)
}

/**
 * @function
 * @author Octene
 * @description 生成一个闭区间数组，间隔为resolution
 * @param {Number} begTs 起始时间戳
 * @param {Number} endTs 结束时间戳
 * @param {Number} resolution 最小会议间隔，秒
 * @return {Number[]} 时间戳数组
 * */
const generateTsSequence=(begTs,endTs,resolution)=>{
    console.log(begTs,endTs,resolution);
    let res = []
    for(let ts=begTs;ts<=endTs;ts+=resolution) res.push(ts)
    return res

}


/**
 * @function
 * @author Octene
 * @description 寻找当前点位附近最近的能整点，超出边界的则返回边界
 * @param {Number} ts 当前点位
 * @param {Number} lb 时间下界（含）
 * @param {Number} ub 时间上界（含）
 * @param {Number} resolution 最小会议间隔，秒
 * @return {Number} 最近的整点时间戳
 * */
const nearestScaleTs = (ts,lb,ub,resolution)=>{

    if(ts<=lb) return lb
    if(ts>=ub) return ub

    const nextresolutionTs = Number(new Decimal(ts).dividedBy(resolution).floor().times(resolution).plus(resolution));
    const previousresolutionTs = nextresolutionTs - resolution

    if(Math.abs(ts - nextresolutionTs) <= Math.abs(ts - previousresolutionTs)) return nextresolutionTs
    return previousresolutionTs
}


export {
    generateTsSequence,
    nearestScaleTs,
	ceilScaleTs
}