/**
 *  created by surui on 13-11-26
 *  游戏服务器
 **/
var logger=require('pomelo-logger').getLogger(__filename);
var ServiceExecuter = require('../../../core/listener/serviceExecuter');
var consts = require('../../../game/wodi/consts/consts');
var ucService = require('./../../../game/wodi/services/ucService');
var tables = require('../../../game/wodi/store/tables');

module.exports = function(app) {
    return new UCHandler(app);
};

var UCHandler = function(app) {
    this.app = app;
	this.channelService = app.get('channelService');
	var tasker = app.get('tasker');
	if(tasker){
		logger.debug('Game服务器被实例化了');
		tasker.start(app);
	}
};

// 这里绑定网络命令和对应处理模块
var serviceExecuter = new ServiceExecuter();
serviceExecuter.init('uc',{
	'login': ucService.login, //创建房间
//  'createRoom': ucService.createRoom, //创建房间
    'joinRoom': ucService.joinRoom,//加入房间
	'ready': ucService.ready,//玩家准备
	'say' : ucService.say,//描述关键词
    'vote' : ucService.vote,//投票
	'leaveRoom' : ucService.leaveRoom,//离开房间
	'chat' : ucService.chat,//离开房间
	'listRoom' : ucService.listRoom//,// 房间列表
//	'getActions' : ucService.getActions//获取大冒险内容
});

/**
 * New client entry chat server.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object(front session)
 * @param  {Function} next    next stemp callback
 * @return {Void}
 *
 */
UCHandler.prototype.entry=function(msg,session,next){

    logger.info('接收到的信息:',JSON.stringify(msg));
	// DEBUG START
	var channel = this.channelService.getChannel("gm", true);
	if(msg && msg.cmd && msg.cmd == 'gm'){
		logger.info('gm登陆');
		var uid = session.uid;
		channel.add(uid, session.get('sid'));
		next(null, {code:200});
		return;
	}
	// DEBUG  END
    serviceExecuter.exec('uc', msg.cmd, session, msg.data, function(err, out_msg){
		// DEBUG START
		channel.pushMessage('users',{data:tables.users});
		channel.pushMessage('roomPlayers',{data:tables.roomPlayers});
		channel.pushMessage('rooms',{data:tables.rooms});
		channel.pushMessage('players',{data:tables.players});
		channel.pushMessage('userplayers',{data:tables.userplayers});
		// DEBUG  END
		logger.info('返回客户端的信息:' + JSON.stringify(out_msg));
		out_msg.cmd = msg.cmd;
		if(out_msg.code == undefined){
			out_msg.code = -999;
		}
		if(out_msg.data == undefined){
			out_msg.data = {};
		}
		var code = out_msg.code;
		if(!isNaN(code)){
			var tips = consts.TIPS[code * -1];
			if(tips){
				out_msg.tips = tips;
			}
		}
		if(code == 0){
			out_msg.code == 200;
		}
		next(err,out_msg);
	});
};