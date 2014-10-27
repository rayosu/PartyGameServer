/**
 * Created by yang_ruidong on 13-12-3.
 */
var logger = require('pomelo-logger').getLogger(__filename);
var app = require('pomelo').app;
var self;

function DirtyDataManager() {
    self = this;
}

DirtyDataManager.prototype.dirtyData = {};

DirtyDataManager.prototype.add = function (key) {
//    logger.info('DirtyDataManager-->', '加入key', key);
    self.dirtyData[key] = key;
//    logger.info('DirtyDataManager-->dirtyData=', self.dirtyData);
}

DirtyDataManager.prototype.remove = function (key) {
//    logger.info('DirtyDataManager-->', '删除key', key);
    delete self.dirtyData[key];
//    logger.info('DirtyDataManager-->dirtyData=', self.dirtyData);
}

DirtyDataManager.prototype.removeAll = function () {
//    logger.info('DirtyDataManager-->', '删除所有key之 前, dirtyData=', self.dirtyData);
    self.dirtyData = {};
//    logger.info('DirtyDataManager-->', '删除所有key之 后, dirtyData=', self.dirtyData);
}

DirtyDataManager.prototype.get = function () {
//    logger.info('DirtyDataManager-->', 'dirtyData=', self.dirtyData);
    return self.dirtyData;
}

module.exports = DirtyDataManager;