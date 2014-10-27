/**
 *  created by surui on 13-11-26
 *  游戏服务器
 **/
var logger=require('pomelo-logger').getLogger(__filename);
var channelUtil = require('../../../core/util/channelUtil');
var ServiceExecuter = require('../../../core/listener/serviceExecuter');
var consts = require('../../../game/wodi/consts/consts');
var ucService = require('./../../../game/wodi/services/ucService');
var DataManager = require('../../../game/wodi/manager/dataManager');
var offlineService = require('../../../game/wodi/services/offlineService');

module.exports = function(app) {
    return new UCRemote(app);
};

var UCRemote = function(app) {
    this.app = app;
	this.channelService = app.get('channelService');
	this.session = app.get('session');
	offlineService.init(app);
};

// 这里绑定网络命令和对应处理模块
var serviceExecuter = new ServiceExecuter();
serviceExecuter.init('uc',{
	'login': ucService.login //创建房间
});

/**
 * New client entry chat server.
 *
 * @param  {Object}   msg     request message
 * @param  {Function} next    next stemp callback
 * @return {Void}
 *
 */
UCRemote.prototype.login=function(msg,next){
    logger.info('接收到的信息:',msg);

    serviceExecuter.exec('uc', msg.cmd, msg.data, function(err, out_msg){
		logger.info('remote返回客户端的信息:' + JSON.stringify(out_msg));
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
			out_msg.code = 200;
		}
		next(err,out_msg);
	});
};

UCRemote.prototype.offline=function(args){
	logger.info('掉线处理:ucRemote.offline');
	var userId = args.userId;
	var destroyRoom = args.destroyRoom;
	offlineService.offline(userId, destroyRoom);
	return;



	var user = DataManager.getUser(userId);
	if(!user){
		return;
	}
	// 用户离线
	user.offline();
	var player = DataManager.getPlayer(user.userId);
	if(!player){
		return;
	}
	var room = DataManager.getRoom(player.roomId);
	if(!room){
		return;
	}
	logger.info('已经加入房间');
	console.log('用户ID:'+user.userId);

	var players = room.getPlayers();
	var onlineNum = 0;
	for(var userId in players){
		logger.info('userId:',userId);
		var user = DataManager.getUser(userId);
		if(user.isOnline()){
			onlineNum++;
		}
	}
	logger.info('当前房间:',player.roomId,',在线人数:',onlineNum);
	var channel = this.channelService.getChannel(channelUtil.getRoomChannelName(room.roomId), false);
	if(onlineNum == 0 || destroyRoom){
		logger.info('没有在线玩家,销毁房间');
		logger.info('发送解散房间事件');
		channel.pushMessage('dismiss',{data:{}},function(){
			user.destroy();
			logger.info('销毁房间');
			//销毁房间
			room.destroy();
			logger.info('销毁频道');
			channel.destroy();
		});
	} else {
		logger.info('有玩家掉线,通知所有人');
		var data = {
			userId:player.userId,
			host:player.host
		};
		channel.pushMessage('offline',{data:data},function(){
			user.destroy();
		});
	}
}