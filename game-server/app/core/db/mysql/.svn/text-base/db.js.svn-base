/**
 * Created by Yang_ruidong on 13-12-9.
 */
var logger = require('pomelo-logger').getLogger(__filename);
var mysql = require('mysql');
var mysqlConfig = require('../../../../config/db/mysqlCfg');
var EntityUtil = require('../entityUtil');
var entityUtil = new EntityUtil;
var pool = mysql.createPool(mysqlConfig.OPT);

var self;
function Db() {
    self = this;
}

// 从连接池 ， 获取连接
var getConnection = function (cb) {
    pool.getConnection(function (err, connection) {
        if (err) {
            logger.error(err);
            cb(err);
        } else {
            cb(null, connection);
        }
    })
}

/**
 * 查询所有doc
 * @param tableName 【所有方法的第一个参数必须是tableName，表示table的名称 ！！！】
 */
Db.prototype.findAll = function (tableName, cb) {
    getConnection(function (err, connection) {
        var sql = 'SELECT * FROM ??';
        connection.query(sql, [tableName], function (err, results) {
            if (err) {
                logger.error(err);
                cb(err);
            } else {
                cb(null, results);
            }
        })
    })
}

/**
 * 根据id查询doc
 * @param id Number类型或者String类型，例如 111, '111'
 */
Db.prototype.findById = function (tableName, id, cb) {
    getConnection(function (err, connection) {
        var keyName = entityUtil.getKeyName(tableName);
        var sql = 'SELECT * FROM ?? WHERE ?? = ?';
        connection.query(sql, [tableName, keyName, id], function (err, results) {
            if (err) {
                logger.error(err);
                cb(err);
            } else {
                cb(null, results[0]);
            }
        })
    })
}

/**
 * 插入该doc
 * @param doc 要插入的doc
 */
Db.prototype.insert = function (tableName, doc, cb) {
    getConnection(function (err, connection) {
        var sql = 'INSERT INTO ?? SET ?';
        connection.query(sql, [tableName, doc], function (err, results) {
            if (err) {
                logger.error(err);
                cb(err);
            } else {
                cb(null, results);
            }
        })
    })
}

/**
 * 如果id已经存在于数据库中，则update，若不存在，则insert ！！！
 * @param doc 要插入或者保存的doc
 */
Db.prototype.saveOrUpdate = function (tableName, doc, cb) {
    var keyName = entityUtil.getKeyName(tableName);
    var id = doc[keyName];
    self.findById(tableName, id, function(err, result){
        if(result){
            getConnection(function (err, connection) {
                var keyName = entityUtil.getKeyName(tableName);
                var sql = 'UPDATE ?? SET ? WHERE ??=?';
                connection.query(sql, [tableName, doc, keyName, id], function (err, results) {
                    if (err) {
                        logger.error(err);
                        cb(err);
                    } else {
                        cb(null, results);
                    }
                })
            })
        }else{
            self.insert(tableName, doc, cb);
        }
    })
}

/**
 * 按照id来删除
 * @param id 含义和findById里的一样，表示主键
 * @param cb
 */
Db.prototype.deleteById = function (tableName, id, cb) {
    getConnection(function (err, connection) {
        var keyName = entityUtil.getKeyName(tableName);
        var sql = 'DELETE FROM ?? WHERE ??=?';
        connection.query(sql, [tableName, keyName, id], function (err, results) {
            if (err) {
                logger.error(err);
                cb(err);
            } else {
                cb(null, results);
            }
        })
    })
}

/**
 * 复杂条件查询
 * @param queryObject 形如{name: 'Jack', age: 123}
 */
Db.prototype.find = function (tableName, queryObject, cb) {
    var length = 0;
    var sqlWhere = '';
    var params = [];
    for(var value in queryObject){
        length ++;
        if(length === 1){
            sqlWhere = sqlWhere + ' ??=? ';
        }else{
            sqlWhere = sqlWhere + ' AND ??=? ';
        }
        params.push(value);
        params.push(queryObject[value]);
    }
    params.unshift(tableName);
    getConnection(function (err, connection) {
        var sql = 'SELECT * FROM ?? WHERE ' + sqlWhere;
        connection.query(sql, params, function (err, results) {
            if (err) {
                logger.error(err);
                cb(err);
            } else {
                cb(null, results);
            }
        })
    })
}

module.exports = Db;