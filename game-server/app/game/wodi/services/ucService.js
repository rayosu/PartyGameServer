/**
 * craeted by yangruidong on 13-11-26
 * 谁是卧底主要逻辑
 * @type {*}
 */
var logger = require('pomelo-logger').getLogger(__filename);
var app = require('pomelo').app;//单例模式
var async = require('async');
var utils = require('../../../core/util/utils');
var channelUtil = require('../../../core/util/channelUtil');
var delayUtil = require('../../../core/util/delayUtil');
var consts = require('../consts/consts');

var dataApi = require('../../../utils/dataApi');
var DataManager = require('../manager/dataManager');
var Timer = require('../../../core/time/timer');
var User = require('../domain/user');
var Player = require('../domain/player');
var Room = require('../domain/room');
var Keyword = require('../domain/keyword');

var channelService = app.get('channelService');

/**
 * 用户登录
 * @param data
 * @param next
 */
module.exports.login = function(data, next){
	try{
		logger.info('玩家登录:login');
		var userId = data['userId'];
		var userName = data['userName']||'游客';
		var user = null;
		async.waterfall([function(cb) {
			logger.info("创建/读取用户数据");
			// 未注册用户进行注册
			if(!userId){
				logger.info("前端没有发送userId,新用户");
				user = User.create(userName);
				utils.invokeCallback(cb, null, null, user);
			} else {
				logger.info("在缓存和数据库中查询用户,userId为:"+userId);
				user = new User();
				user.userId = userId;
				user.get(function(err,user){
					utils.invokeCallback(cb, null, err, user);
				});
			}
		},function(err, user, cb){
			logger.info("进行用户登录操作");
			if(user == null){
				// TODO 测试阶段临时代码
				user = User.create(userName);
				user.save();
			}
			logger.info(user, user.userName, user.userId);
			// 用户上线
			user.online();
			// 登录用户保存信息
			DataManager.addUser(user);
			var out = {};
			logger.info("登录成功!");
			var player = DataManager.getPlayer(userId);
			// 如果玩家已经加入了游戏
			if(player){
				var roomId = player.roomId;
				var room = DataManager.getRoom(roomId);
				if(room){
//					if(room.status == consts.GAME_STATUS.READY
//						|| room.status == consts.GAME_STATUS.START
//						|| room.status == consts.GAME_STATUS.VOTE
//						|| room.status == consts.GAME_STATUS.REVOTE){

						var players = out['players'] = [];
						var roomPlayers = DataManager.getPlayersByRoomId(roomId);
						for(var i in roomPlayers){
							var playerData = {
								userId:roomPlayers[i].userId,
								userName:roomPlayers[i].userName,
								site:roomPlayers[i].site,
								status:roomPlayers[i].status,
								ready:roomPlayers[i].ready,
								hasVoted:roomPlayers[i].hasVoted,
								targetId:roomPlayers[i].targetId,
								said:roomPlayers[i].said,
								sayContent:roomPlayers[i].sayContent,
								dead:roomPlayers[i].dead
							};
							if(player.host == 1){
								playerData['votes'] = roomPlayers[i].votes;
							}
							players.push(playerData);
						}
//					} else if(room.status == consts.GAME_STATUS.SAMEVOTE
//						|| room.status == consts.GAME_STATUS.RESULT
//						|| room.status == consts.GAME_STATUS.OVER){
//
//						//out = player.outCache;
//                        out = room.outCache;
//					}
					// 基础信息
					out['room'] = {
						roomId:room.roomId,
						ucNum:room.ucNum,
						allUcNum:room.allUcNum,
						playerNum:room.playerNum,
						liveNum:room.liveNum,
						status:room.status == 0 ? 0:1
					};
//					out['player'] = {
//						status:player.status,
//						keyword:player.keyword//,
//						hasVoted:player.hasVoted,
//						dead:player.dead
//					};
					out['inRoom'] = 1;
				} else {
					out['inRoom'] = 0;
					logger.info('房间没有找到');
				}
			// 玩家的关键词
			out['keyword'] = player.keyword;
			} else {
				logger.info('玩家没有找到');
			}
			// 玩家id,玩家名称
			out['userId'] = user.userId;
			out['userName'] = user.userName;

			next(err,{code:consts.SUCCESS, data:out});
		}],function(err) {
			logger.error("未知异常:",err);
			next(err, {code: consts.SYSTEM_ERROR});
		});
	}catch(err){
		next(err,{code:consts.SYSTEM_ERROR, tips:err.message});
	}
}

/**
 * 加入房间
 * @param session
 * @param data {roomId,userName}
 * @param next
 */
module.exports.joinRoom=function(session,data,next){
    try{
        logger.info('加入房间:joinRoom');
		var userId = session.uid;
		var roomId = data['roomId'],
			type = data['type'];
		// 房间号必须为数字
		if(!roomId || isNaN(roomId) || !type || isNaN(type)){
			next(null,{code:consts.ERROR.ROOM.NOT_EXISTS});
			return;
		}
		roomId = roomId + '';
		logger.info("data:"+JSON.stringify(data));
		// 根据房间信息获取房间,并加入房间
		var room = DataManager.getRoom(roomId);
		if(!room){
			logger.info('房间不存在,创建房间号:'+roomId);
			room = new Room();
			room.roomId = roomId;
			room.type = type;
			room.status = consts.GAME_STATUS.READY;// 房间初始化为准备状态
			DataManager.addRoom(room);
		} else if(room.type != -1 && room.type != type){
			next(null,{code:consts.ERROR.ROOM.NOT_EXISTS});
			return;
		}
		var ret = checkRoom(room);
		if(ret != 0){
			next(null,{code:ret});
			return;
		}
		// 非解锁状态
		if(room.locked != 0){
			next(null,{code:consts.ERROR.ROOM.JOIN_LOCK});
			return;
		}
		// 找出用户
		var user = DataManager.getUser(userId);
		//判断是否在房间内
		var player = DataManager.getPlayer(userId);
		// 如果在其他房间内
		if(player && player.roomId && player.roomId != roomId){
			logger.info('已经在其他房间内, 从原房间中踢掉');
//			next(null, {code:consts.ERROR.PLAYER.ALREADY_IN_ROOM, tips:'已经在其他房间内'});
//			return;
			playerLeaveRoom(session, roomId, userId);
		}
		if(player && player.roomId == roomId){
			// 已经在房间内了,不需要做什么
		} else if(!player){
			// 创建玩家信息
			player = Player.create(user);
			player.host = false;
			// 房间满人
			if(room.fullPlayers()){
				logger.info('房间满人,不允许加人');
				next(null, {code:consts.ERROR.ROOM.FULL_MEMBER});
				return;
			}
			Timer.cancel(delayUtil.getDelayStartGame(room.roomId));
			// 房间状态为准备状态
			room.status = consts.GAME_STATUS.READY;
			// 添加玩家到房间
			room.join(player);
			var players = getPlayersByRoomId(room.roomId);
			addToChannel(session, room.roomId, user.userId, user.userName, player.site);
			logger.info('返回所有玩家信息');
			next(null,{code:consts.SUCCESS, data:{roomId:room.roomId, site:player.site, players:players}});
		}
    }catch(err){
        next(err,{code:consts.SYSTEM_ERROR, tips:err.message});
    }
}

/**
 * 玩家准备
 * @param session
 * @param data
 * @param next
 */
module.exports.ready = function(session, data, next){
	try{
		logger.info('玩家准备:ready');
		var userId = session.uid;
		var player = DataManager.getPlayer(userId);
		if(!player){
			next(null,{code:consts.ERROR.PLAYER.NOT_EXISTS});
			return;
		}
		player.beReady();
		var channel = channelService.getChannel(channelUtil.getRoomChannelName(player.roomId), false);
		if(channel){
			channel.pushMessage('ready', {"data":{userId:userId}});
		}
		var room = DataManager.getRoom(player.roomId);
		if(!room){
			next(null,{code:consts.ERROR.ROOM.NOT_EXISTS});
		}
		logger.info('当前房间游戏状态:'+room.status);
		var roomPlayers = room.getPlayers();
		for(var id in roomPlayers){
			var roomPlayer = roomPlayers[id];
			if(!roomPlayer.isReady()){
				next(null,{code:consts.SUCCESS});
				return;
			}
		}
		// 游戏结束,第一个人准备后,游戏进行准备状态
		if(room.status == consts.GAME_STATUS.OVER){
			room.status = consts.GAME_STATUS.READY
		}
		// 人数足够,开始游戏
		if(room.enoughPlayers()){
			Timer.delay(delayUtil.getDelayStartGame(room.roomId),function(){
				// 游戏未开始 && 已准备玩家数足够 && 不存在未准备玩家
				if(room.status == consts.GAME_STATUS.READY && room.enoughPlayers() && !room.hasUnReadyPlayer()){
					startGame(room);
				}
			}, 5000);//30000
			return;
		}
		next(null,{code:consts.SUCCESS});
	}catch(err){
		next(err,{code:consts.SYSTEM_ERROR, tips:err.message});
	}
}

/**
 * 分配关键词/开始游戏
 * @param room
 * @param next
 */
var startGame = function(room){
	logger.info('分配关键词(开始游戏)');
	logger.info('当前房间游戏状态:'+room.status);
	// 检测房间状态[准备|投票结果]
	if(room.status != consts.GAME_STATUS.READY){
		logger.info('游戏已经开始');
		return;
	}
	Timer.cancel(delayUtil.getDelayEndVote(room.roomId));
	// 开始投票,房间加锁
	room.lock();
	// 改变房间状态,游戏已经开始
	room.changeStatus(consts.GAME_STATUS.START);
	// 生存玩家数为房间人数
	room.liveNum = room.playerNum;
	var playerArr = DataManager.getPlayerArrayByRoomId(room.roomId);
	// 所有玩家的状态重新刷新
	for(var i in playerArr){
		var player = playerArr[i];
		player.reset();
	}
	// 获取本房间频道
	var channel = channelService.getChannel(channelUtil.getRoomChannelName(room.roomId), false);
	//获取关键词
	var keywords = Keyword.create().getData();
	room.keywords = keywords;
	// 设置当前卧底数
	room.ucNum = room.getallUcNum();
	// 打乱
	playerArr = utils.randomArray(playerArr);
	for(var i = 0; i < playerArr.length; i++){
		var uid = playerArr[i].userId;
		// 排前面的都是卧底
		if(i < room.allUcNum){
			room.ucIds.push(playerArr[i].userId);
			playerArr[i].keyword = keywords[0];
//				playerArr[i].setUndercover();
			playerArr[i].ucFlag = 1;
		} else {
			playerArr[i].keyword = keywords[1];
			playerArr[i].ucFlag = 0;
		}
		logger.info('玩家:'+playerArr[i].userId+'的关键词为:'+playerArr[i].keyword);
		//TODO 这个值是前端服务器的服务器ID,前端必须被调用,才会进行赋值
		var sid = channel.records[uid].sid;
		if(sid == null){
			logger.error("sid为空,频道内找不到对应玩家!");
			return;
		}
		logger.info('发送游戏开始广播');
		var msg = {
			data:{
				keyword:playerArr[i].keyword,
				ucNum:room.allUcNum
			}
		};
		channelService.pushMessageByUids('startGame', msg,[{uid: uid, sid: sid}]);
	}
}

/**
 * 描述关键词
 * @param session
 * @param data
 * @param next
 */
module.exports.say=function(session,data,next){
	try{
		logger.info('描述:say');
		var content = data.content || "";
		var userId = session.uid;
		var player = DataManager.getPlayer(userId);
		var room = DataManager.getRoom(player.roomId);
		if(room.status == consts.GAME_STATUS.READY){
			next(null, {code:consts.ERROR.GAME.STATUS_ERROR});
			return;
		}
		if(player.isSay()){
			next(null, {code:consts.ERROR.PLAYER.HE_WAS_SAID});
			return;
		}
		player.beSay(content);//设置为已描述
		// 第一个人描述了,就算投票状态
		if(room.status != consts.GAME_STATUS.VOTE){
			room.status = consts.GAME_STATUS.VOTE;
//			var unSayPlayerNum = room.getUnSayPlayerNum();
//			if(unSayPlayerNum == 0){
//				if(channel){
//					logger.log("所有人描述完毕,开始投票");
//					channel.pushMessage('startVote', {"data":{}});
//				}
//			} else if(unSayPlayerNum == 1){
//				setTimeout(function(room){
//					if(room.status != consts.GAME_STATUS.VOTE){
//						// 房间进入投票状态
//						room.status = consts.GAME_STATUS.VOTE;
//						var channel = channelService.getChannel(channelUtil.getRoomChannelName(room.roomId), false);
//						if(channel){
//							logger.log("还未描述的不等了,开始投票");
//							channel.pushMessage('startVote', {"data":{}});
//						}
//					}
//				}, 30000, room);
//			}
		}
		var channel = channelService.getChannel(channelUtil.getRoomChannelName(player.roomId), false);
		if(channel){
			channel.pushMessage('say', {"data":{userId:userId, content:content}});
		}
		next(null, {code:consts.SUCCESS});
	}catch(err){
		next(err,{code:consts.SYSTEM_ERROR, data:{tips:err.message}});
	}
}

/**
 * 投票
 * @param session
 * @param data {userId}
 * @param next
 */
module.exports.vote = function(session,data,next){
    try{
        logger.info('投票:vote');
        var myUserId = session.uid;
        var targetUserId = data['userId'];
        logger.info('投票人:'+myUserId);
        logger.info('被投票人:'+targetUserId);
		// 玩家自己
        var myPlayer = DataManager.getPlayer(myUserId);
		if(!myPlayer){
			next(null,{code:consts.ERROR.PLAYER.NOT_EXISTS});
			return;
		}
		// 玩家已经被淘汰
		if(myPlayer.isDie()){
			next(null,{code:consts.ERROR.PLAYER.YOU_ARE_DIE});
			return;
		}
		// 不能投给自己
		if(myUserId == targetUserId){
			next(null,{code:consts.ERROR.GAME.CANT_VOTE_MYSELF});
			return;
		}
        // 不能重复投票
        if(myPlayer.hasVoted){
            next(null,{code:consts.ERROR.PLAYER.ALREADY_VOTE});
            return;
        }
		// 被投票人
		var targetPlayer = DataManager.getPlayer(targetUserId);
		// 被投票玩家不存在
        if(!targetPlayer){
            next(null,{code:consts.ERROR.PLAYER.NOT_EXISTS});
            return;
        }
		// 目标玩家已经被淘汰
		if(targetPlayer.isDie()){
			next(null,{code:consts.ERROR.PLAYER.HE_WAS_DIE});
			return;
		}
		// 获取房间信息
		var room = DataManager.getRoom(myPlayer.roomId);

		// 重投票状态,但被投票对象不是平票玩家
		if(room.equalsStatus(consts.GAME_STATUS.REVOTE) && !targetPlayer.isReVote()){
			next(null,{code:consts.ERROR.GAME.CANT_VOTE_TARGET});
			return;
		}
		logger.info('当前房间游戏状态:'+room.status);
		if(!room.equalsStatus(consts.GAME_STATUS.VOTE) 		//全员投票
			&& !room.equalsStatus(consts.GAME_STATUS.REVOTE)//部分投票
			&& !room.equalsStatus(consts.GAME_STATUS.RESULT)){

			next(null,{code:consts.ERROR.GAME.STATUS_ERROR, tips:'房间不是投票状态不能投票'});
			return;
		}
		// 投票
		myPlayer.vote(targetPlayer);
		logger.info('告知有玩家进行了投票');
		var channel = channelService.getChannel(channelUtil.getRoomChannelName(myPlayer.roomId), false);
		if(channel){
			channel.pushMessage('vote', {data:{userId:myPlayer.userId, targetId:targetPlayer.userId}});
		}

		next(null,{code:consts.SUCCESS});

		// 检测是否有人没投票
		var unVotePlayerNum = room.getUnVotePlayerNum();
		logger.info("未投票玩家数:"+unVotePlayerNum);
		// 所有人已经投票则直接出投票结果
		if(unVotePlayerNum == 0){
			// 结束投票
			endVote(room);
		}
		// 如果还有一人未投票,则等待15秒出投票结果
		else if(unVotePlayerNum == 1){
			Timer.delay(delayUtil.getDelayEndVote(room.roomId),function(_room, _endVote){
//				if(_room.equalsStatus(consts.GAME_STATUS.VOTE)){
					_endVote(_room);
//				}
			}, 15000, room, endVote);
		}
    }catch(err){
        next(err,{code:consts.SYSTEM_ERROR,data:{tips:err.message}});
    }
}

/**
 * 结束投票
 * @param room
 */
var endVote = function(room){
	logger.info('获取投票结果:endVote');
	logger.info('当前房间游戏状态:'+room.status);

	Timer.cancel(delayUtil.getDelayEndVote(room.roomId));
	// 打印房间内玩家状态[DEBUG]
	room.printPlayers();
	var roomPlayers = room.getPlayers();
	// 获取票数最高的玩家列表
	var topVotePlayers = room.getTopVotePlayers();
	// 票数
	var topVote = topVotePlayers[0].votes;
	// 判断投票结果
	var voteResult = -1;
	// 最高票玩家IDs
	var playerIds = [];
	// 出局的玩家
	var deadId = -1;
	// 五种结果
	if(topVotePlayers.length == 1){
		var topVotePlayer = topVotePlayers[0];
		// 把最高票杀死
		room.kill(topVotePlayer);
		deadId = topVotePlayer.userId;
		// 投死的是卧底
		if(topVotePlayer.isUndercover()){
			logger.debug('打印房间信息:');
			logger.debug(JSON.stringify(room));
			if(room.isGameOver()){
				logger.info('投死的是卧底,平民获胜');
				voteResult = consts.VOTE_RESULT.PEOPLE_WIN;
				room.changeStatus(consts.GAME_STATUS.OVER);
			}
			else {
				logger.info('投死的是卧底,还有其他卧底');
				voteResult = consts.VOTE_RESULT.UC_FIND;
				room.changeStatus(consts.GAME_STATUS.RESULT);
			}
		}
		// 投死的是平民
		else {
			logger.debug('打印房间信息:');
			logger.debug(JSON.stringify(room));
			if(room.isGameOver()){
				logger.info('投死的是平民,卧底获胜');
				voteResult = consts.VOTE_RESULT.UC_WIN;
				room.changeStatus(consts.GAME_STATUS.OVER);
			}
			else {
				logger.info('投死的是平民');
				voteResult = consts.VOTE_RESULT.PEOPLE_DIE;
				room.changeStatus(consts.GAME_STATUS.RESULT);
			}
		}
	}
	// 多人票数一样
	else {
		logger.info('多人票数一样');
		for(i in topVotePlayers){
			var o = {
				userId:topVotePlayers[i].userId,
				vote:topVotePlayers[i].vote
			};
			playerIds.push(topVotePlayers[i].userId);
			// 设置为再次投票
			topVotePlayers[i].reVote();// 设置为重新投票玩家
		}
		voteResult = consts.VOTE_RESULT.MULTI;
		room.changeStatus(consts.GAME_STATUS.SAMEVOTE);// 重投票
	}
	// 发送投票结果
	var channel = channelService.getChannel(channelUtil.getRoomChannelName(room.roomId), false);
	// 输出的信息
	var out = {data:{status:voteResult, votes:topVote}};
	// 如果游戏已经结束
	var isGameOver = room.isGameOver();
	// 输出的玩家列表信息
	var outPlayers = out.data['players'] = [];
	for(var id in roomPlayers){
		var roomPlayer = roomPlayers[id];
		var roomPlayerData = {
			userId:roomPlayer.userId,
			userName:roomPlayer.userName,
			sameVote:0
		};
		// 早就死了的人
		if(roomPlayer.isDie()){
			roomPlayerData['dead'] = 1;
		} else {
			roomPlayerData['dead'] = 0;
		}
		// 当前才死的人
		if(deadId != -1 && deadId ==  roomPlayer.userId){
			roomPlayerData['dead'] = 2;
		}
		// 平票的人
		if(topVotePlayers.length != 0){
			for(var i in topVotePlayers){
				var topVotePlayer = topVotePlayers[i];
				if(roomPlayer.userId == topVotePlayer.userId){
					roomPlayerData['sameVote'] = 1;
				}
			}
		}
		// 如果游戏已经结束
		if(isGameOver){
			// 卧底标识
			roomPlayerData['ucFlag'] = roomPlayer.ucFlag;
			// 关键词
			roomPlayerData['keyword'] = roomPlayer.keyword;
			// 加人锁打开
			room.unlock();
		}
		// 被投票数
		roomPlayerData['votes'] = roomPlayer.votes;
		outPlayers.push(roomPlayerData);
	}
	// 如果游戏结束,则创建惩罚信息
	if(room.equalsStatus(consts.GAME_STATUS.OVER)){
		if(room.type == consts.ROOM_TYPE.ONLINE){
			room.questions = dataApi.questions.getRandom();
			out.data["questions"] = room.questions;
		} else if(room.type == consts.ROOM_TYPE.WECHAT){
			room.actions = [];
			for(var i = 0; i < 5; i++){
				var action = dataApi.actions[i].getRandom();
				room.actions.push(action);
			}
			out.data["actions"] = room.actions;
		} else if(room.type == consts.ROOM_TYPE.FACE){

		}
	}
//	room.cacheResult(out.data);
	logger.debug('广播房间号',room.roomId, '广播的信息:', JSON.stringify(out));
	channel.pushMessage('endVote', out, function(){
		logger.info('投票结束,重置投票状态');
		for(var id in outPlayers){
			var roomPlayerData = outPlayers[id];
			roomPlayerData['userName'] = roomPlayers[roomPlayerData['userId']].userName;
		}
		// 投票状态重置
		room.resetVote();
	});
}

/**
 * 离开房间
 * @param session
 * @param data
 * @param next
 */
module.exports.leaveRoom=function(session,data,next){
    try{
        logger.info('离开房间:'+session.uid);
        var userId = session.uid;
        var player = DataManager.getPlayer(userId);
        if(!player){
            next(null,{code:consts.ERROR.PLAYER.NOT_EXISTS,tips:'玩家不在房间内'});
            return;
        }
        var roomId = player.roomId;
		var room = DataManager.getRoom(roomId);
		var ret = checkRoom(room);
		if(ret != 0){
			next(null,{code:ret});
			return;
		}
		logger.info('当前房间游戏状态:'+room.status);
        // 房主/最后一个人 离开了,解散房间
//        if(player.host || room.playerNum == 1){
//            logger.info('我是房主/我是本房间最后一个人,蛋定地离开了');
//            dismissAllMembers(room);
//        }
		// 如果房主掉线了,允许你们退出游戏
//		else if(!room.getHostPlayer().getUser().isOnline()){
			logger.info('神一样的特权,房主不在线,房员偷偷离开了');
			// 退出房间
			playerLeaveRoom(session, roomId, userId);
//		}
		// 其他情况只能在列表界面退出游戏
//		else {
//			// 如果游戏没有结束,不允许离开
//			if(room.status != consts.GAME_STATUS.READY && room.status != consts.GAME_STATUS.OVER){
//				logger.info('游戏已经开始,不允许中途退出');
//				next(null,{code:consts.ERROR.GAME.STATUS_ERROR});
//				return;
//			}
//			logger.info('在等待列表,房员离开了');
//            //房间人数判断
//            playerLeaveRoom(session, roomId, userId);
//        }
		next(null,{code:consts.SUCCESS});
    }catch(err){
        next(err,{code:201, data:{tips:err.message}});
    }
}

/**
 * 聊天接口
 * @param session
 * @param data
 * @param next
 */
module.exports.chat=function(session,data,next){
	try{
		var content = data.content || "";
		var userId = session.uid;
		var player = DataManager.getPlayer(userId);
		var channel = channelService.getChannel(channelUtil.getRoomChannelName(player.roomId), false);
		if(channel){
			channel.pushMessage('chat', {"data":{userId:userId, content:content}});
		}
		next(null,{code:consts.SUCCESS});
	}catch(err){
		next(err,{code:consts.SYSTEM_ERROR, data:{tips:err.message}});
	}
}

/**
 *	获取真心话
 * @param session
 * @param data
 * @param next
 */
module.exports.getQuestions = function(session,data,next){
	try{
		logger.info('获取真心话内容');
		next(null,{code:consts.SUCCESS, data:{question:question}});
	}catch(err){
		console.dir(err);
		next(err,{code:consts.SYSTEM_ERROR, data:{tips:err.message}});
	}
}

///**
// *	获取大冒险
// * @param session
// * @param data
// * @param next
// */
//module.exports.getActions = function(session,data,next){
//	try{
//		logger.info('获取大冒险内容');
//		var actions = [];
//		for(var i = 0; i < 5; i++){
//			var action = dataApi.actions[i].getRandom();
//			actions.push(action);
//		}
//		next(null,{code:consts.SUCCESS, data:{actions:actions}});
//	}catch(err){
//		console.dir(err);
//		next(err,{code:consts.SYSTEM_ERROR, data:{tips:err.message}});
//	}
//}

/**
 * 获取房间列表
 * @param session
 * @param data
 * @param next
 */
module.exports.listRoom = function(session,data,next){
	try{
		logger.info('列出房间列表 start');
		var roomId = data.roomId,
			count = data.count || 10,
			nextPage = data.next,
			type = data.type,
			roomIds = null;
		// 房间号为0表示获取首页
		if(roomId == 0){
			nextPage = 1;
		}
		if(nextPage){
			roomIds = DataManager.getNextRoomsFrom(roomId, count, type);
		} else {
			roomIds = DataManager.getLastRoomsFrom(roomId, count, type);
		}
		var rooms = [];
		// 如果查询到房间
		if(roomIds && roomIds.length != 0){
			for(var i = 0; i < roomIds.length; i++){
				var roomId = roomIds[i];
				var room = DataManager.getRoom(roomId);
				if(room){
					var roomInfo = {
						id: room.roomId,
						s: room.status,
						n: room.playerNum
					};
					rooms.push(roomInfo);
				} else {
				}
			}
		} else {
			logger.info('没有房间了');
		}
		next(null,{code:consts.SUCCESS, data:{rooms:rooms}});
	}catch(err){
		console.dir(err);
		next(err,{code:consts.SYSTEM_ERROR, data:{tips:err.message}});
	}
}

var checkHostPlayer = function(player, host){
	if(!player){
		return consts.ERROR.PLAYER.NOT_EXISTS;
	}
	if(host && !player.host){
		return consts.ERROR.ROOM.AUTH_ACCESS;
	}
	return consts.SUCCESS;
}

var checkRoom = function(room, status){
	if(!room){
		return consts.ERROR.ROOM.NOT_EXISTS;
	}
	return consts.SUCCESS;
}

/**
 * 销毁房间
 */
var dismissAllMembers = function(room){
    var channel = channelService.getChannel(channelUtil.getRoomChannelName(room.roomId),false);
	logger.info('发送解散房间命令');
	channel.pushMessage('dismiss',{data:{}},function(){
		//销毁房间
		logger.info('解散房间号:'+room.roomId);
		room.destroy();
		logger.info('销毁频道');
		channel.destroy();
	});
}

/**
 *  判断用户是否已经加入其它房间
 */
var hasJoinOtherRoom = function(userId){
    logger.info('判断玩家是否已经在房间中');
    var player = DataManager.getPlayer(userId);
    return player.roomId != -1 ? true : false;
}

var playerLeaveRoom = function(session, roomId, userId){
//	DataManager.print();
    var player = DataManager.getPlayer(userId);
    var room = DataManager.getRoom(roomId);

	logger.info('剔除玩家:kick');
	room.leave(player);

	// 这个值是前端服务器的服务器ID,前端必须被调用,才会进行赋值
	var sid = session.get('sid');
	var channel = channelService.getChannel(channelUtil.getRoomChannelName(roomId), false);
	if (!!channel) {
		logger.info('玩家:'+userId+' 离开频道');
		channel.leave(userId, sid);
		logger.info('将玩家踢出房间');
		channel.pushMessage('leaveRoom', {"data":{userId:userId}});
	}
}
/*
	获取简版的指定房间号玩家信息
 */
var getPlayersByRoomId = function(roomId){
	var playerInfos = [];
	var players = DataManager.getPlayersByRoomId(roomId);
	for(var i in players){
		playerInfos.push({userId:players[i].userId, userName:players[i].userName, site:players[i].site, ready:players[i].ready});
	}
	return playerInfos;
}

/**
 * 加入指定频道[待抽取为公共方法]
 * @param session
 * @param roomId
 * @param userId
 * @param userName
 * @param site
 */
var addToChannel = function (session, roomId, userId, userName, site) {
	// 这个值是前端服务器的服务器ID,前端必须被调用,才会进行赋值
	var sid = session.get('sid');
	try{
		logger.info('加入频道:addToChannel');
		logger.info(' userId:'+userId+" sid:"+sid+" roomId:"+roomId+" userName:"+userName);
		var channel = channelService.getChannel(channelUtil.getRoomChannelName(roomId), true);
		// 频道不为空
		if (channel) {
			logger.info('通知其他玩家有人加入房间');
			channel.pushMessage('joinRoom',{data:{userName:userName, userId:userId, site:site}},function(){
				channel.add(userId, sid);
			});
		} else {
			logger.info('频道为空');
		}
	}catch(err){
		logger.error("创建或加入频道出现异常", err);
//		next({code:consts.SYSTEM_ERROR});
	}
};