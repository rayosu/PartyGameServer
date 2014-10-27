var logger = require('pomelo-logger').getLogger(__filename);
var app = require('pomelo').app;
var EntityUtil = require('../../../core/db/entityUtil');
var entityUtil = new EntityUtil;

module.exports = {

    save: function (db, val, cb) {
        logger.info('commonSync: save, val=', val);
        try {
            db.saveOrUpdate(val.collectionName, val.doc, function (){});
        } catch (err) {
            logger.info('调用队列commonSync.save方法出错：errMessage=', err.message);
        }
    }

};