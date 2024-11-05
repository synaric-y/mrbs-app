export default {
    hello: '你好，',
    welcome: '欢迎来到会议室预约系统',
    login:{
      success: '登录成功',
      fail: '登录失败'
    },
    title:{
      reservation: '预约会议室',
      myReservation: '我的预约',
    },
    area:{
        notify:{
            disabled: '此区域的会议室不可用'
        },
        location:{
            all: '全部',
            Shanghai: '上海',
            Nanjing: '南京'
        }
    },
    room:{
        title: '会议室',
        untitled: '未命名',
        status:{
            available: '可预定',
            disabled: '不可用',
            full: '已约满',
        },
        notify:{
            disabled: '此会议室不可用',
            full: '此会议室已约满'
        }
    },
    meeting:{
        status:{
            canceled: '已取消',
            finished: '已结束',
            inProgress: '进行中',
            toStart: '待开始'
        },
        form:{
            date: '日期',
            topic: '会议主题',
            placeholder: '请输入',
            missing: '必须输入会议主题！',
            rep_interval: '重复周数',
            rep_interval_fail: '重复周数格式错误',
            rep_day_fail: '请选择至少一个重复日期',
        },
        notify:{
            none: '暂无会议',
        },
        noDesc: '暂无描述',
        reserve:{
            title: '提示',
            message: '确认预定会议?',
            success: '会议预订成功！',
            fail: '会议预订失败！',
            repeat_success: '循环会议创建成功！',
            repeat_fail: '循环会议创建失败！',
        },
        edit:{
            title: '提示',
            message: '确认修改会议?',
            success: '会议修改成功！',
            fail: '会议修改失败！'
        },
        cancel:{
            title: '提示',
            message: '确认取消会议?',
            success: '会议取消成功！',
            fail: '会议取消失败！'
        }
    },
    button: {
        confirm: '确认',
        reserve: '预订',
        repeated_reserve: '循环定时预定',
        cancel: '取消',
        edit: '编辑'
    },
    filter: {
        disabled: '不可约',
        inProgress: '进行中',
        toStart: '待开始'
    },
    day: {
        today: '今天',
        yesterday: '昨天',
        tomorrow: '明天',
        monday: '周一',
        tuesday: '周二',
        wednesday: '周三',
        thursday: '周四',
        friday: '周五',
        saturday: '周六',
        sunday: '周日'
    },
    time:{
        minute: '分钟',
        hour: '小时',
        minutes: '分钟',
        hours: '小时',
        notAvailable: '找不到可用时间',
    }
}