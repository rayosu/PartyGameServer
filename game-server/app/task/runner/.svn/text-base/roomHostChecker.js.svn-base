/**
 * Created by surui on 13-12-27.
 */
var logger=require('pomelo-logger').getLogger(__filename);
var DataManager = require('../../game/wodi/manager/dataManager');
var offlineService = require('../../game/wodi/services/offlineService');
var consts = require('../../game/wodi/consts/consts');

module.exports.run = function(app){
	var offlineUsers = DataManager.getOfflineUsers();
	for(var i in offlineUsers){
		var offlineUser = offlineUsers[i];
		var player = DataManager.getPlayer(offlineUser.userId);
		// 用户在线或非房主则跳过
		if(!offlineUser || offlineUser.isOnline() || (player && player.host != 1)){
			continue;
		}
		if(offlineUser.isTimeout()){

			// 远程通知销毁房间
			logger.debug('远程通知销毁房间:'+offlineUser.userId);
			offlineService.offline(offlineUser.userId, 1, function(){
				// 清除用户
//				offlineUser.destroy();
			});
		} else {
//			logger.debug('用户掉线计数器加1');
			offlineUser.gainTime();
		}
	}
}