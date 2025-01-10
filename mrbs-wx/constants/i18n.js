import {i18n} from '@/i18n'


function translate(key){
	return i18n.global.t(key)
}

const YESTERDAY = translate('common.day.yesterday')
const TODAY = translate('common.day.today')
const TOMORROW = translate('common.day.tomorrow')

const HOUR = translate('common.time.hour')
const HOURS = translate('common.time.hours')
const MINUTE = translate('common.time.minute')
const MINUTES = translate('common.time.minutes')
const SECOND = translate('common.time.second')
const SECONDS = translate('common.time.seconds')

const MONDAY = translate('common.week.monday')
const TUESDAY = translate('common.week.tuesday')
const WEDNESDAY = translate('common.week.wednesday')
const THURSDAY = translate('common.week.thursday')
const FRIDAY = translate('common.week.friday')
const SATURDAY = translate('common.week.saturday')
const SUNDAY = translate('common.week.sunday')

export {
	YESTERDAY,
	TODAY,
	TOMORROW,
	
	HOUR,
	HOURS,
	MINUTE,
	MINUTES,
	SECOND,
	SECONDS,
	
	MONDAY,
	TUESDAY,
	WEDNESDAY,
	THURSDAY,
	FRIDAY,
	SATURDAY,
	SUNDAY
}