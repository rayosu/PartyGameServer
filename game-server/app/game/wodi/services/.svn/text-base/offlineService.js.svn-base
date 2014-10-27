/**
 * Created by surui on 13-12-31.
 */
var logger=require('pomelo-logger').getLogger(__filename);
var channelUtil = require('../../../core/util/channelUtil');
var ServiceExecuter = require('../../../core/listener/serviceExecuter');
var consts = require('../../../game/wodi/consts/consts');
var DataManager = require('../../../game/wodi/manager/dataManager');

module.exports.init = function(app){
	app = app;
	channelService = app.get('channelService');
	session = app.get('session');
}

module.exports.offline = function(userId, destroyRoom, next){
	logger.info('掉线处理:offlineService.offline');

	var user = DataManager.getUser(userId);
	if(!user){
		return;
	}
	// 用户离线
	user.offline();
	var player = DataManager.getPlayer(user.userId);
	if(!player){
		user.destroy();
		return;
	}
	var room = DataManager.getRoom(player.roomId);
	if(!room){
		DataManager.removePlayer(player);
		user.destroy();
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
	var channel = channelService.getChannel(channelUtil.getRoomChannelName(room.roomId), false);
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
			if(next){
				next();
			}
		});
	} else {
		logger.info('有玩家掉线,通知所有人');
		var data = {
			userId:player.userId,
			host:player.host
		};
		channel.pushMessage('offline',{data:data},function(){
			if(next){
				next();
			}
		});
	}
}