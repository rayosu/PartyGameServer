var logger = require('pomelo-logger').getLogger(__filename);
var app = require('pomelo').app;
//var Db = require('../../../core/db/mysql/db');
var Db = require('../../../core/db/mongodb/db');
var db = new Db;

module.exports = function (app) {
    return new DbRemote(app);
};

var DbRemote = function (app) {
    this.app = app;
    this.channelService = app.get('channelService');
};

DbRemote.prototype.saveRightNow = function (key, entity, cb) {
    logger.info('DbRemote:消息队列调用：saveRightNow, key=', key, 'entity=', entity);
    try{
        this.app.get('sync').flush('commonSync.save', key, entity, cb);
    }catch(err){
        logger.error(err);
        cb(err);
    }
}

DbRemote.prototype.save = function (key, entity, cb) {
    logger.info('DbRemote:消息队列调用：save, key=', key, 'entity=', entity);
    try{
        this.app.get('sync').exec('commonSync.save', key, entity);
    }catch(err){
        logger.error(err);
        cb(err);
    }
}

DbRemote.prototype.findById = function (collectionName, id, cb) {
    logger.info('DbRemote:消息队列调用：findById, collectionName=', collectionName, 'id=', id);
    try{
        db.findById(collectionName, id, cb);
    }catch(err){
        logger.error(err);
        cb(err);
    }
}

DbRemote.prototype.find = function (collectionName, queryObject, cb) {
    logger.info('DbRemote:消息队列调用：find, collectionName=', collectionName, 'queryObject=', queryObject);
    try{
        db.find(collectionName, queryObject, cb);
    }catch(err){
        logger.error(err);
        cb(err);
    }
}