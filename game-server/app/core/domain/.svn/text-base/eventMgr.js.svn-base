/**
 * Created by yang_ruidong on 13-11-14.
 */
var logger = require('pomelo-logger').getLogger(__filename);
var app = require('pomelo').app;
var RedisManager = require('./../cache/redisManager');
var redisManager = new RedisManager();
var DirtyDataManager = require('./../cache/dirtyDataManager');
var dirtyDataManager = new DirtyDataManager();

function EventManager() {
}

EventManager.prototype.addSaveEvent = function(entity) {

    entity.on('saveRightNow', function () {
        // 放入redis； 立刻flush
        dirtyDataManager.remove(entity.getDefaultKey());
        redisManager.set(entity.getDefaultKey(), entity.getDocument());
        app.rpc.db.dbRemote.saveRightNow(null, entity.getDefaultKey(), {collectionName: entity.getCollectionName, doc: entity.getDocument().doc}, function(){});
    });

    entity.on('save', function () {
        // isDirty = true； 之后再定时exec
        dirtyDataManager.add(entity.getDefaultKey());
        redisManager.set(entity.getDefaultKey(), entity.getDocument());
    });

}

module.exports = EventManager;