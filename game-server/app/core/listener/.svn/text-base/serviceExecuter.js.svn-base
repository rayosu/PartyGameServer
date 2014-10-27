/**
 * Created by surui on 13-11-13.
 */
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var logger = require('pomelo-logger').getLogger(__filename);

/**
 * Persistent object, it is saved in database
 *
 * @api public
 */
var ServiceExecuter = function() {
	EventEmitter.call(this);
};

util.inherits(ServiceExecuter, EventEmitter);

module.exports = ServiceExecuter;

/**
 *
 * @param game		游戏名称
 * @param config	命令绑定配置
 */
ServiceExecuter.prototype.init = function(game, config){
	logger.info('ServiceExecuter.init');
	this.config = config;
	for(var cmd in config){
//		logger.info('请求的服务:',cmd);
		var fun = config[cmd];
		this.on(game+'_'+cmd, fun);
	}
}
ServiceExecuter.prototype.exec = function(game, cmd, session, data, next){
	logger.info('ServiceExecuter.exec');
	if(!this.config[cmd]){
		next(new Error('cmd '+cmd+' not find bind'),{tips:'cmd '+cmd+' not bind'});
		return;
	}
	// 如果玩家没有登录
	if(cmd != "login" && !session.uid){
		logger.info('请先进行登录');
		next(null, {tips:'请先进行登录!'});
		return;
	}
	this.emit(game+'_'+cmd, session, data, next);
};