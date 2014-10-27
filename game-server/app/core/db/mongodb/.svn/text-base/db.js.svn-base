/**
 * Created by yang_ruidong on 13-10-30.
 * 基于 mongoSkin ， 操作数据库通用的方法
 */
var logger = require('pomelo-logger').getLogger(__filename);
var mongo = require('mongoskin');
var mongoConfig = require('../../../../config/db/mongodbCfg');
var db = mongo.db(mongoConfig.URL, mongoConfig.OPT);
var EntityUtil = require('../entityUtil');
var entityUtil = new EntityUtil;

function Db() {

}

/**
 * 查询所有doc
 * @param collectionName 【所有方法的第一个参数必须是collectionName，表示collection的名称 ！！！】
 */
Db.prototype.findAll = function (collectionName, cb) {
    db.collection(collectionName).find().toArray(function (err, cursor) {
        if (err) {
            logger.error(err);
            cb(err);
        } else {
            cb(null, cursor);
        }
    });
}

/**
 * 根据id查询doc
 * @param id Number类型或者String类型，例如 111, '111'
 */
Db.prototype.findById = function (collectionName, id, cb) {
    var queryByIdObject = entityUtil.getQueryByIdObject(collectionName, id);
	if(!queryByIdObject){
		cb(new Error('构建数据库操作语句失败!'));
	}
    db.collection(collectionName).findOne(queryByIdObject, function (err, cursor) {
        if (err) {
            logger.error(err);
            cb(err);
        } else {
            cb(null, cursor);
        }
    });
}

/**
 * 插入该doc
 * @param doc 要插入的doc
 */
Db.prototype.insert = function (collectionName, doc, cb) {
    db.collection(collectionName).save(doc, function (err, cursor) {
        if (err) {
            logger.error(err);
            cb(err);
        } else {
            cb(null, cursor);
        }
    })
}

/**
 * 如果id已经存在于数据库中，则update，若不存在，则insert ！！！
 * @param doc 要插入或者保存的doc
 */
Db.prototype.saveOrUpdate = function (collectionName, doc, cb) {
    var keyName = entityUtil.getKeyName(collectionName);
    var queryByIdObject = entityUtil.getQueryByIdObject(collectionName, doc[keyName]);
	if(!queryByIdObject){
		cb(new Error('构建数据库操作语句失败!'));
	}
    db.collection(collectionName).update(queryByIdObject, doc, {upsert: true}, function (err, cursor) {
        if (err) {
            logger.error(err);
            cb(err);
        } else {
            cb(null, cursor);
        }
    })
}

/**
 * 按照id来删除
 * @param id 含义和findById里的一样，表示主键
 * @param cb
 */
Db.prototype.deleteById = function (collectionName, id, cb) {
    var queryByIdObject = entityUtil.getQueryByIdObject(collectionName, id);
	if(!queryByIdObject){
		cb(new Error('构建数据库操作语句失败!'));
	}
    db.collection(collectionName).remove(queryByIdObject, {}, function (err, cursor) {
        if (err) {
            logger.error(err);
            cb(err);
        } else {
            cb(null, cursor);
        }
    });
}

/**
 * 复杂条件查询
 * @param queryObject 形如{name: 'Jack', age: 123}
 */
Db.prototype.find = function (collectionName, queryObject, cb) {
    db.collection(collectionName).find(queryObject).toArray(function (err, cursor) {
        if (err) {
            logger.error(err);
            cb(err);
        } else {
            cb(null, cursor);
        }
    });
}

module.exports = Db;