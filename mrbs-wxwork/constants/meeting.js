/** 
 * @constant
 * @type {Number}
 * @default
 * @description 待开始
*/ 
const MEETING_TO_START = 0

/** 
 * @constant
 * @type {Number}
 * @default
 * @description 进行中
*/ 
const MEETING_IN_PROGRESS = 1

/** 
 * @constant
 * @type {Number}
 * @default
 * @description 已结束
*/ 
const MEETING_FINISHED = 2

/** 
 * @constant
 * @type {Number}
 * @default
 * @description 已过时, 用于标识已过去的时间
*/ 
const MEETING_EXPIRED = 3

export {
	MEETING_TO_START,
	MEETING_IN_PROGRESS,
	MEETING_FINISHED,
	MEETING_EXPIRED
}