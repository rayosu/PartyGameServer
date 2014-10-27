
var logger=require('pomelo-logger').getLogger(__filename);
var tables=require('../store/tables');

/**
 * created by pingshi 13-11-27
 * 用户管理
 * @constructor
 */
function DataManager(){

}

DataManager.addUser = function(user){
    logger.info('增加用户:addUser:'+user.userId);
	tables.users[user.userId] = user;
}

DataManager.getUser = function(userId){
//	logger.info('获取用户:'+userId);
	var user = tables.users[userId];
	if(!user){
		// TODO 从缓存中进行查询
	}
	return user;
}

DataManager.deleteUser = function(userId){
	logger.info('删除用户:deleteUser: '+userId);
	delete tables.users[userId];
}

DataManager.getOfflineUsers = function(){
//	logger.info('获取离线用户信息:getOfflineUsers');
	var offlineUsers = [];
	for(var userId in tables.users){
		var offlineUser = tables.users[userId];
		if(offlineUser && !offlineUser.isOnline()){
//			logger.info('获取的离线用户ID: '+userId);
			offlineUsers.push(offlineUser);
		}
	}
	return offlineUsers;
}

DataManager.addRoom = function(room){
    logger.info('增加房间:addRoom:'+room.roomId);
    tables.rooms[room.roomId + ''] = room;
	var roomIdInt = parseInt(room.roomId);
	for(var i = 0; i < tables.roomIds.length; i++){
		if(tables.roomIds[i] == roomIdInt){
			return;
		}
	}
	tables.roomIds.push(roomIdInt);
	tables.roomIds.sort();
}

DataManager.getRoom = function(roomId){
//    logger.info('获取房间信息:getRoom:'+roomId);
    return tables.rooms[roomId + ''];
}

/**
 * 获取往后的房间号
 * @param fromRoomId
 * @param count
 * @returns {Array}
 */
DataManager.getNextRoomsFrom = function(fromRoomId, count, type){
	var roomIds = [];
	for(var i = 0; i < tables.roomIds.length; i++){
		var roomId = tables.roomIds[i];
		var room = DataManager.getRoom(roomId);
		if(roomId > fromRoomId && room.type ==  type){
			roomIds.push(roomId);
			if(roomIds.length >= count){
				return roomIds;
			}
		}
	}
	return roomIds;
}

/**
 * 获取往前的房间号
 * @param fromRoomId
 * @param count
 * @returns {Array}
 */
DataManager.getLastRoomsFrom = function(fromRoomId, count, type){
	var roomIds = [];
	logger.info('fromRoomId:'+fromRoomId);
	for(var i = tables.roomIds.length - 1; i >= 0; i--){
		var roomId = tables.roomIds[i];
		var room = DataManager.getRoom(roomId);
		if(roomId < fromRoomId && room.type ==  type){
			roomIds.push(roomId);
			if(roomIds.length >= count){
				return roomIds;
			}
		}
	}
	return roomIds;
}
/**
 * 根据用户ID获取玩家信息
 * @param id		用户ID
 * @returns {Player}
 */
DataManager.getPlayer = function(id){
//	logger.info('获取玩家信息:getPlayer');
	var player=tables.players[id];
	if(!player){
//		logger.info('玩家不存在');
		return null;
	}else{
//		logger.info('玩家:'+player.userId+" 房间号:"+player.roomId);
		return player;
	}
}

/**
 * 销毁房间
 * @param roomId
 */
DataManager.deleteRoom = function(roomId){
    logger.info('删除房间:deleteRoom:'+roomId);
	var room = tables.rooms[roomId + ''];
	if(!room){
		return;
	}
	var players = room.getPlayers();
	for(var i in players){
		var player = players[i];
		if(player){
			delete tables.players[player.userId];
		}
	}
	delete tables.roomPlayers[roomId + ''];
	delete tables.rooms[roomId + ''];

	var roomIdInt = parseInt(room.roomId);
	for(var i = 0; i < tables.roomIds.length; i++){
		if(tables.roomIds[i] == roomIdInt){
			delete tables.roomIds[i];
			return;
		}
	}
}
/**
 * 根据用户ID获取玩家信息
 * @param userId		用户ID
 * @returns {Player}
 */
DataManager.getPlayerInRoom = function(userId, roomId){
//	logger.info('获取玩家信息:getPlayerInRoom');
	var players = this.getPlayersByRoomId(roomId);
	if(!players){
		logger.error('房间玩家列表不存在', roomId);
		return null;
	}
	var player=players[userId];
	if(!player){
		logger.error('玩家不存在', userId);
		return null;
	}else{
		logger.info('玩家:'+player.userId+" 房间号:"+player.roomId);
		return player;
	}
}

/**
 * 根据房间号获取该房间所有玩家
 * @param roomId
 * @returns {Array}
 */
DataManager.getPlayerArrayByRoomId = function(roomId){
	var roomPlayers = tables.roomPlayers[roomId + ''];
	var playerArray = [];
	if(roomPlayers){
		for(var userId in roomPlayers){
			playerArray.push(roomPlayers[userId]);
		}
	}
	return playerArray;
}

/**
 * 添加玩家进房间
 * @param roomId	房间号
 * @param player	玩家对象
 */
DataManager.addPlayerToRoom = function(roomId, player){
	logger.info('添加玩家到房间:addPlayerToRoom');
	var players = tables.roomPlayers[roomId + ''];
	if(!players){
		logger.debug("创建roomPlayers");
		players = tables.roomPlayers[roomId + ''] = new Array();
	}
	if(players[player.userId]){
		delete players[player.userId];
	}
	players[player.userId] = player;
	tables.players[player.userId] = player;
}
/**
 * 根据房间号获取该房间所有玩家
 * @param roomId
 * @returns {Array}
 */
DataManager.getPlayersByRoomId = function(roomId){
	return tables.roomPlayers[roomId + ''];
}

/**
 * 删除玩家
 @private
 */
DataManager.removePlayer = function(player){
	var roomPlayers = tables.roomPlayers[player.roomId];
	if(roomPlayers){
		delete roomPlayers[player.userId];
	}
	delete tables.players[player.userId];
}
/*
 * 重新开始投票时，清除缓存
 * @param roomid
 * @param result
 */
DataManager.clearCache = function( roomId ){
	var room = DataManager.getRoom( roomId );
	room.outCache = null;
}

//DataManager.print = function(){
//    logger.info('-----------------begin----------------');
//	logger.info('| user list:');
//    for(var userId in tables.users){
//        logger.info('|---| user:'+userId+':'+tables.users[userId].userName);
//    }
//	logger.info('| player list:');
//    for(var userId in tables.players){
//		logger.info('|---| player:'+userId+':'+tables.players[userId].userName);
//    }
//	logger.info('| room player list:');
//	for(var roomId in tables.roomPlayers){
//		var players = tables.roomPlayers[roomId];
//		logger.info('|---| roomId:'+roomId);
//		for(var i in players){
//			logger.info('|------| player:'+players[i].userId);
//		}
//	}
//	logger.info('| room list:');
//    for(var roomId in tables.rooms){
//        logger.info('|---| room:'+roomId);
//    }
//    logger.info('-------------------end----------------');
//}

module.exports=DataManager;