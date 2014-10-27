/**
 * Created by surui on 13-11-28.
 * 房间信息类
 * 存储房间的所有状态信息
 */
var logger=require('pomelo-logger').getLogger(__filename);
var util=require('util');
var events=require('events');
var consts=require('../consts/consts');
var dataApi = require('../../../utils/dataApi');
var DataManager=require('../manager/dataManager');

function Room(){
	this.roomId = -1;//房间id
	this.type = -1;
	this.ucIds = [];//卧底id
	this.keywords = [];//关键词
	this.ucNum = 0;//当前卧底数量
	this.allUcNum = 0;//总共卧底数量
	this.playerNum = 0;//房间人数
	this.liveNum = 0;//生还人数
	this.status = -1;//状态
	this.locked = 0;//加人锁0-可加入新成员 1-不可加入新成员
	this.players = {};
	// 初始化房间座位
	for(var site = 1; site <= consts.MAX_PLAYER_NUM; site++){
		this.players[site] = null;
	}
	this.question = "";
	this.actions = [];
}


Room.prototype.reset = function(player){
	this.ucIds = [];
	this.ucNum = 0;
	this.allUcNum = 0;
	this.playerNum = 0;
	this.liveNum = 0;
	this.keywords = [];
	this.status = -1;
	this.locked = 0;
	this.question = "";
	this.actions = [];
}
/**
* 房间加锁
* @returns {*}
*/
Room.prototype.lock = function(){
	this.locked = 1;
}

/**
* 房间解锁
*/
Room.prototype.unlock = function(){
	this.locked = 0;
}

/**
 * 是否卧底
 * @param player		检测对象
 * @returns {boolean}
 */
Room.prototype.isUndercover = function(player){
	for(var ucId in this.ucIds){
		if(player.userId == ucId){
			return true;
		}
	}
	return false;
}
/**
 * 根据房间参与人数获取卧底总数
 * @returns {number}
 */
Room.prototype.getallUcNum = function(){
	if(this.playerNum > 16){
		this.allUcNum = 4;
	} else if(this.playerNum > 12){
		this.allUcNum = 3;
	} else if(this.playerNum > 8){
		this.allUcNum = 2;
	} else {
		this.allUcNum = 1;
	}
	return this.allUcNum;
}
/**
 * 获取房间所有玩家
 * @returns {Object}
 */
Room.prototype.getPlayers = function(){
	var cfg = arguments[0];
	// 本房间所有玩家
	var roomPlayers = DataManager.getPlayersByRoomId(this.roomId);
	if(cfg){
		var newRoomPlayers = {};
		for(var key in roomPlayers){
			var roomPlayer = roomPlayers[key];
			// 新对象
			var newRoomPlayer = {};
			var l = cfg.length;
			// 拷贝属性
			for(var i = 0; i < l; i++){
				var ppt = cfg[i];
				if(roomPlayer.hasOwnProperty(ppt)){
					newRoomPlayer[ppt] = roomPlayer[ppt]
				}
			}
			newRoomPlayers[key] = newRoomPlayer;
		}
		return newRoomPlayers;
	}
	return roomPlayers;
}

/**
 * 获取房间内已准备玩家
 * @returns {Array}
 */
Room.prototype.getReadyPlayers = function(){
	var readyPlayers = [];
	var roomPlayers = DataManager.getPlayersByRoomId(this.roomId);
	for(var key in roomPlayers){
		var roomPlayer = roomPlayers[key];
		if(roomPlayer.isReady()){
			readyPlayers.push(roomPlayer);
		}
	}
	return readyPlayers;
}

/**
 * 检测房间内未准备玩家
 * @returns {Array}
 */
Room.prototype.hasUnReadyPlayer = function(){
	var roomPlayers = DataManager.getPlayersByRoomId(this.roomId);
	for(var key in roomPlayers){
		var roomPlayer = roomPlayers[key];
		if(!roomPlayer.isReady()){
			return true;
		}
	}
	return false;
}
/**
 * 获取生还的玩家
 *
 * @returns {Array} 返回玩家数组
 */
Room.prototype.getLivePlayers = function(){
	var livePlayers = [];
	var players = DataManager.getPlayersByRoomId(this.roomId);
	for(var id in players){
		// 找出没死的
		if(!players[id].isDie()){
			livePlayers.push(players);
		}
	}
	return livePlayers;
}
/**
 * 获取房间内的卧底
 * @returns {Array}
 */
Room.prototype.getUndercovers = function(){
	return getPlayersByType(1);
}
/**
 * 获取票数最高的玩家
 * @returns {Array}
 */
Room.prototype.getTopVotePlayers = function(){
	var topVotePlayers = []; // 票数最高的 user list
	// 本房间所有玩家
	var roomPlayers = DataManager.getPlayersByRoomId(this.roomId);
	logger.info('排序投票玩家');
	// 投票排序玩家
	var sortPlayers = [];
	for(var userId in roomPlayers){
		sortPlayers.push(roomPlayers[userId]);
	}
	//排序
	sortPlayers.sort(function(playerA, playerB){
		return playerB.votes - playerA.votes;
	});

	logger.info('找出票数最高的玩家列表');
	// 找出票数最高的玩家列表
	var topVote = sortPlayers[0].votes;
	if(!sortPlayers[0].isDie()){
		topVotePlayers.push(sortPlayers[0]);
	}
	for(var i = 1; i < sortPlayers.length; i++){
		var player = sortPlayers[i];
		if(!player.isDie() && player.votes == topVote){
			topVotePlayers.push(sortPlayers[i]);
		}
	}
	return topVotePlayers;
}
/**
 * 获取未描述的活着的玩家
 * @returns {number}
 */
Room.prototype.getUnSayPlayerNum = function(){
	var playerStatus = consts.PLAYER_STATUS.NORMAL;
	if(this.status == consts.GAME_STATUS.SAMEVOTE){
		playerStatus = consts.PLAYER_STATUS.REVOTE;
	}
	var count = 0;
	// 本房间所有玩家
	var roomPlayers = DataManager.getPlayersByRoomId(this.roomId);
	for(var userId in roomPlayers){
		var player = roomPlayers[userId];
		// 活人并且未描述
		if(player.equalsStatus(playerStatus) && !player.isDie() && !player.isSay()){
			count++;
		}
	}
	return count;
}
/**
 * 获取未投票的活着的玩家
 * @returns {number}
 */
Room.prototype.getUnVotePlayerNum = function(){
	var count = 0;
	// 本房间所有玩家
	var roomPlayers = DataManager.getPlayersByRoomId(this.roomId);
	for(var userId in roomPlayers){
		var player = roomPlayers[userId];
		// 需要被投票的活人,且未描述
		if(!player.isDie() && !player.hasVoted){
			count++;
		}
	}
	return count;
}
/**
 * 重置本房间所有人的投票状态和票数
 */
Room.prototype.resetVote = function(){
	// 本房间所有玩家
	var roomPlayers = DataManager.getPlayersByRoomId(this.roomId);
	// 投票结束,重置投票状态
	for(var userId in roomPlayers){
		roomPlayers[userId].resetVote();// 重置'票数'和'是否已经投票'
		roomPlayers[userId].resetSay();// 重置已描述
	}
}

/**
 * 是否有足够开房的小伙伴
 * @returns {boolean}
 */
Room.prototype.enoughPlayers = function(){
	var readyPlayers = this.getReadyPlayers();
//	return this.playerNum >= consts.MIN_PLAYER_NUM;
	return readyPlayers.length >= consts.MIN_PLAYER_NUM;
}

Room.prototype.fullPlayers = function(){
	return this.playerNum == consts.MAX_PLAYER_NUM;
}

/**
 * 加入新成员
 * @param player
 */
Room.prototype.join = function(player){
	logger.info('增加玩家到房间', this.roomId, player.userId);
	this.playerNum ++;
	player.roomId = this.roomId;
	for(var site in this.players){
		if(this.players[site] == null){
			logger.info('设置玩家座位号:'+site);
			player.site = site;
			this.players[site] = player;
			DataManager.addPlayerToRoom(this.roomId, player);
			return;
		}
	}
}

/**
 * 某人被杀死
 * @param player	被杀的可怜人
 */
Room.prototype.kill = function(player){
	// 杀了
	player.die();
	// 如果这个人是卧底
	if(player.isUndercover()){
		this.ucNum --;
	}
	this.liveNum --;
}
/**
 * 玩家离开房间/踢出游戏
 * @param player
 */
Room.prototype.leave = function(player){
	// 是卧底,还没死的话
	if(!player.isDie() && player.isUndercover() && this.ucNum != 0){
		this.ucNum --;
		delete this.ucIds[player.userId];
	}
	if(this.players[player.site]){
		logger.info('玩家离开座位:'+player.site);
		this.players[player.site] = null;
		player.site = -1;
	}
	logger.info('删除玩家:'+player.userId);
	DataManager.removePlayer(player);
	logger.info('减少玩家数量:room.playerNum');
	this.playerNum --;
}
/**
 * 改变游戏状态
 * @param gameStatus
 */
Room.prototype.changeStatus = function(gameStatus){
	this.status = gameStatus;
}
/**
 * 游戏状态匹配
 * @param gameStatus
 * @returns {boolean}
 */
Room.prototype.equalsStatus = function(gameStatus){
	return this.status == gameStatus;
}
/**
 * 是否卧底已经全部找出(是否游戏结束)
 * @returns {boolean}
 */
Room.prototype.isGameOver = function(){
	// 剩余玩家小于等于{consts.UC_WIN_PLAYER_NUM}人,卧底获胜
	if(this.ucNum != 0 && this.liveNum <= consts.UC_WIN_PLAYER_NUM){
		// 卧底获胜
		return true;
	}
	// 卧底死光光
	else if(this.ucNum == 0){
		// 平民获胜
		return true;
	}
	return false;
}

/**
 * 打印本房间所有玩家的投票状态和关键词
 */
Room.prototype.printPlayers = function(){
	// 本房间所有玩家
	var roomPlayers = DataManager.getPlayersByRoomId(this.roomId);

	logger.info('打印同房间所有玩家信息');
	for(var i in roomPlayers){
		logger.info('用户:'+roomPlayers[i].userId+' 票数:'+roomPlayers[i].votes+' 是否为卧底:'+roomPlayers[i].isUndercover+' 关键词:'+roomPlayers[i].keyword);
	}
}
/**
 * 将每局结果缓存起来，用于在显示结果阶段重登录，避免重新计算
 * @param out
 */
Room.prototype.cacheResult = function(out){
	this.outCache = out;
}
Room.prototype.clearCache = function(){
	this.outCache = null;
}
/**
 * 销毁房间
 */
Room.prototype.destroy = function(){
	DataManager.deleteRoom(this.roomId);
}

/**
 * 获取生还的玩家ID
 * @returns {Array}
 */
var getPlayersByType = function(type){
	var typePlayers = [];
	var players = DataManager.getPlayersByRoomId(this.roomId);
	for(var id in players){
		// 找出卧底
		if(type == 1 && players[id].isUndercover()){
			typePlayers.push(players[id]);
		}
		// 找出平民
		else if(type == 0 && !players[id].isUndercover()){
			typePlayers.push(players[id]);
		}
	}
	return typePlayers;
}

module.exports=Room;