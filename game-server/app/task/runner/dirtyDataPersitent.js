/**
 * Created by yang_ruidong on 13-12-31.
 */
var logger=require('pomelo-logger').getLogger(__filename);
var RedisManager = require('../../core/cache/redisManager');
var redisManager = new RedisManager;

module.exports.run = function(app){
    var self = this;
    try {
        redisManager.getDirtyDataList(self.dirtyData, function (err, list, redisMgetArgs) {
            if (err) {
                logger.error(err);
                return;
            }
            for (var i = 0; i < list.length; i++) {
                var data = JSON.parse(list[i]);
                if (data.collectionName && data.doc) {
                    app.rpc.db.dbRemote.save(null, redisMgetArgs[i], {collectionName: data.collectionName, doc: data.doc}, function () {
                    });
                }
            }
            self.removeAll();
        })
    } catch (err) {
        logger.error(err);
    }
}
