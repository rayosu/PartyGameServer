/**
 * Created by yang_ruidong on 13-11-28.
 */
var logger = require('pomelo-logger').getLogger(__filename);
var redis = require('redis');
var redisConfig = require('../../../config/db/redisCfg');
var client = redis.createClient(redisConfig.PORT, redisConfig.HOST);

client.on("error", function (err) {
    logger.error(err);
});

function RedisManager() {

}

// 存入一个entity
RedisManager.prototype.set = function (key, entity) {
//    logger.info('RedisManager-->存入一个entity key=' + key);
    client.set(key, JSON.stringify(entity));
}

// 读取一个entity
RedisManager.prototype.get = function (key, cb) {
//    logger.info('RedisManager-->读取一个entity key=' + key);
    client.get(key, function (err, data) {
		if(err) {
			console.error(err);
		} else {
			cb(err, JSON.parse(data));
		}
    })
}

RedisManager.prototype.getDirtyDataList = function (dirtyData, cb) {
    var args = [];
    var i = 0;
    for (var key in dirtyData) {
        args[i++] = dirtyData[key];
    }
    if (i === 0) {
//        logger.info('RedisManager-->没有需要持久化的dirtyData');
        return;
    }
    client.mget(args, function (err, list) {
        if(err){
            logger.error(err);
        }else{
            cb(null, list, args);
        }
    })
}

module.exports = RedisManager;