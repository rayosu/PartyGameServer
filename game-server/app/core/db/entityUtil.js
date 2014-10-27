/**
 * Created by surui on 13-12-6.
 */
var logger = require('pomelo-logger').getLogger(__filename);
var entityMapping = require('../../../config/db/entityMapping');

function EntityUtil() {

}

// 获取id名称
EntityUtil.prototype.getKeyName = function (collectionName) {
    if (!this.entitys[collectionName]) {
        logger.error('在EntityMapping里找不到', collectionName);
        return;
    }
    return this.entitys[collectionName].keyName;
}

// 获取id查询对象
EntityUtil.prototype.getQueryByIdObject = function (collectionName, id) {
    if (!this.entitys[collectionName]) {
        logger.error('在EntityMapping里找不到', collectionName);
        return;
    }
    var key = this.entitys[collectionName].keyName;
	if(!key || !id){
		logger.error('keyName或id不能为空');
		return null;
	}
    var object = {};
    object[key] = id;
    return object;
}

// 验证id (key)
EntityUtil.prototype.validateKey = function (collectionName) {
    var key = this.entitys[collectionName];
    if (!key) {
        logger.error('在EntityMapping里找不到', collectionName);
        return false;
    }
    var reg = new RegExp("^[0-9]*$");
    if(!reg.test(key)){
        logger.error('在Entity里的key不是Number类型', collectionName);
        return false;
    }
    return true;
}

// 实体类的相关属性
EntityUtil.prototype.entitys = entityMapping;

module.exports = EntityUtil;