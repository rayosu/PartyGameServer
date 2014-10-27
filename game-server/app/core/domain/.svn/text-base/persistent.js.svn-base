/**
 * Module dependencies
 */
var logger = require('pomelo-logger').getLogger(__filename);
var app = require('pomelo').app;
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var Db = require('../../core/db/mongodb/db');
var db = new Db();
var EntityUtil = require('../../core/db/entityUtil');
var entityUtil = new EntityUtil();
var RedisManager = require('./../cache/redisManager');

//var User = require('../../game/wodi/domain/user');
//var Room = require('../../game/wodi/domain/room');
//var Player = require('../../game/wodi/domain/player');
//var Keyword = require('../../game/wodi/domain/keyword');

var redisManager = new RedisManager();

var Persistent = function () {
    EventEmitter.call(this);
};

util.inherits(Persistent, EventEmitter);

Persistent.prototype.save = function () {
    this.emit('save');
}

Persistent.prototype.saveRightNow = function () {
    this.emit('saveRightNow');
}

/**
 * 从缓存或者数据库中,根据当前实体的主键获取数据
 * 注意:此操作会修改原来的实例,并没有对对象进行clone[技术上还没实现]
 * @param cb
 */
Persistent.prototype.get = function (cb) {
    var entity = this;
    try {
        var redisKey = this.getDefaultKey();
        redisManager.get(redisKey, function (err, data) {
//			logger.info('Redis缓存中获取');
            if (data) {
//				logger.info('Redis缓存查询结果:');
//				logger.info(JSON.stringify(data));
				var doc = data.doc;
				// 转换为对应的类
				for(var key in doc){
					var value = doc[key];
					if(entity.hasOwnProperty(key)){
						entity[key] = value;
					}
				}
                cb(err, entity);
            } else {
//                logger.info('从redis中找不到【key】=', redisKey, '，需要从数据库中读取');
                var collectionName = entity.getCollectionName;
                var keyName = entityUtil.getKeyName(collectionName);
                app.rpc.db.dbRemote.findById(null, collectionName, entity[keyName], function(err,cursor){
//					logger.info('芒果数据库查询结果:');
//					logger.info(JSON.stringify(cursor));
					if(cursor == null){
						cb(err, null);
						return;
					}
					if(cursor['_id']){
						delete cursor['_id'];
					}
					// 转换为对应的类
					for(var key in cursor){
						var value = cursor[key];
						if(entity.hasOwnProperty(key)){
							entity[key] = value;
						}
					}
//					logger.info('保存到缓存数据库:');
					redisManager.set(entity.getDefaultKey(), entity);
					cb(err,entity);
				});
            }
        })
    } catch (err) {
        cb(err);
        logger.error('根据主键获取entity失败，entity=', entity, '; errMessage=', err.message);
    }
}

// others array
Persistent.prototype.query = function (queryObject, cb) {
    try {
        var collectionName = this.getCollectionName;
        app.rpc.db.dbRemote.find(null, collectionName, queryObject, cb);
//        db.find(collectionName, queryObject, cb);
    } catch (err) {
        logger.error('根据自定义的条件查询entity失败，queryObject=', queryObject, '; errMessage=', err.message);
    }
}

module.exports = Persistent;