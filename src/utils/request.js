import axios from "axios";
import {tansParams} from '@/utils/tool'
import errorCode from "@/utils/errorCode";


//baseURL: process.env.VUE_APP_BASE,
const service = axios.create({
    baseURL: import.meta.env.VITE_APP_HOST,
    timeout: 60000
});


service.interceptors.request.use(config => {

    // 拦截重复请求(即当前正在进行的相同请求)
    // 标识请求
    const requestData = getRequestIdentify(config, true);
    // 取消重复请求
    removePending(requestData, true);
    // 创建当前请求的取消方法
    config.cancelToken = new CancelToken((c) => {
        pending[requestData] = c;
    });

    // console.log('requestData ---- ',requestData)
    // const isToken = (config.headers || {}).isToken === false;
    // const { getToken } = useUserStore();
    // if (getToken() && !isToken) {
    //     config.headers['Authorization'] = 'Bearer ' + getToken() // 让每个请求携带自定义token 请根据实际情况自行修改
    // }
    // get请求映射params参数
    if (config.method === 'get' && config.params) {
        let url = config.url + '?' + tansParams(config.params);
        url = url.slice(0, -1);
        config.params = {};
        config.url = url;
    }
    return config
})

service.interceptors.response.use(res => {
    // 未设置状态码则默认成功状态
    const code = res.data.code || 200;

    const msg = res.data.msg || res.msg || errorCode[code] || errorCode['default']

    // 二进制数据则直接返回
    if(res.request.responseType ===  'blob' || res.request.responseType ===  'arraybuffer'){
        return res.data
    }

    // 报错
    if (code!==undefined && code !== 0 && code !== 200 )
        return Promise.reject(new Error(msg))

    return res.data

},error => {
    let { message } = error;
    return Promise.reject(new Error(message))
})

// 标识请求
const getRequestIdentify = (config, isRequest = false) => {
    let url = config.url;
    if (isRequest) {
        url = config.baseURL + config.url.substring(1, config.url.length);
    }
    return config.method === 'get'
        ? encodeURIComponent(url + JSON.stringify(config.params))
        : encodeURIComponent(config.url + JSON.stringify(config.data?.requestTag || config.data));
};
// 取消重复请求
const pending = {};
const CancelToken = axios.CancelToken;
const removePending = (key, isRequest = false) => {
    if (pending[key] && isRequest) {
        pending[key]('取消重复请求');
    }
    delete pending[key];
};

export default service
