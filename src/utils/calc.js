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

export {getNearestScale}