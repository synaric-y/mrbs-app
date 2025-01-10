
/**
 * @author LongJin {@link https://xie.infoq.cn/article/2a7a2a91e4c9520ee18e7e2d3 Infoq}
 * @file 取消重复请求
 */

/** @module Request */

/**
 * @class
 * @classdesc 请求管理器
 */
class RequestManager {
	constructor() {
		this.idMap = new Map()
	}

	/**
	 * @function
	 * @author LongJin
	 * @description 生成唯一ID，并将ID和请求信息存储到map对象中
	 * @param {string} method - 请求方法
	 * @param {string} url - 请求URL
	 * @param {object} params - 请求参数
	 * @returns {string|boolean} - 生成的唯一ID，如果存在相同id则返回false
	 */
	generateId(method, url, params) {
		const id = this.generateUniqueId(method, url, params)
		if (this.idMap.has(id)) {
			return false
		}
		this.idMap.set(id, {
			method,
			url,
			params
		})
		return id
	}

	/**
	 * @function
	 * @author LongJin
	 * @description 生成唯一ID的方法
	 * @param {string} method - 请求方法
	 * @param {string} url - 请求URL
	 * @param {object} params - 请求参数
	 * @returns {string} - 生成的唯一ID
	 */
	generateUniqueId(method, url, params) {
		const idString = `${method}-${url}-${this.serializeObject(params)}`
		let id = 0;
		for (let i = 0; i < idString.length; i++) {
			id = ((id << 5) - id) + idString.charCodeAt(i)
			id |= 0;
		}
		return id.toString()
	}

	/**
	 * @function
	 * @author LongJin
	 * @description 序列化对象为字符串（递归地）
	 * @param {object} obj - 要序列化的对象
	 * @returns {string} - 序列化后的字符串
	 */
	serializeObject(obj) {
		const keys = Object.keys(obj).sort()
		const serializedObj = {}
		for (let key of keys) {
			const value = obj[key]
			if (value !== null && typeof value === 'object') {
				serializedObj[key] = this.serializeObject(value)
			} else {
				serializedObj[key] = value
			}
		}
		return JSON.stringify(serializedObj)
	}

	/**
	 * @function
	 * @author LongJin
	 * @description 根据ID删除map对象中的请求信息
	 * @param {string} id - 要删除的唯一ID
	 */
	deleteById(id) {
		this.idMap.delete(id)
	}
}

export default RequestManager