/**
 * created by pingshi 13-11-26
 * 玩家信息类
 * 游戏过程中玩家产生的信息都存储与此对象中
 */
var logger=require('pomelo-logger').getLogger(__filename);
var util=require('util');
var events=require('events');
var consts=require('../consts/consts');
var DataManager=require('../manager/dataManager');

function Player(){
    this.userId = -1;//用户id
	this.userName = '';
	this.roomId = -1;//房间号
	this.site = -1;
    this.reset();
}

/**
 * 重置玩家状态
 */
Player.prototype.reset = function(){
	this.status = consts.PLAYER_STATUS.NORMAL;//正常状态
	this.dead = 0;
	this.ucFlag = 0;//是否为卧底
	this.keyword = '';//关键词
	this.votes = 0;//被投票数
	this.hasVoted = 0;//是否已经投票
	this.targetId = 0;
	this.ready = 0;
	this.said = 0;
	this.sayContent = "";
	this.outCache = null;
}
//TODO 打算将玩家状态封装为一个状态类
function Status(){

}

Player.create = function(user){
	logger.info('创建玩家:_createPlayer');
	var player = new Player();
	player.userId=user.userId;
	player.userName = user.userName;
	return player;
}
/**
 * 设置为已经描述过
 */
Player.prototype.beSay = function(content){
	this.sayContent = content;
	this.said = 1;
}
/**
 * 是否已经进行过描述
 * @returns {boolean}
 */
Player.prototype.isSay = function(){
	return this.said == 1;
}
/**
 * 重置已描述状态
 */
Player.prototype.resetSay = function(){
	this.said = 0;
}
/**
 * 准备
 */
Player.prototype.beReady = function(){
	this.ready = 1;
}
/**
 * 是否准备
 * @returns {boolean}
 */
Player.prototype.isReady = function(){
	return this.ready == 1;
}
/**
 * 投票
 * @param player	被投票人
 */
Player.prototype.vote = function(player){
	this.hasVoted = 1;
	this.targetId = player.userId;
	player.votes ++;
	logger.info('玩家:'+this.userId+' 投了:'+player.userId+' 一票');
}
/**
 * 玩家死亡
 */
Player.prototype.die = function(){
	this.dead = 1;
}
/**
 * 玩家是否死亡
 */
Player.prototype.isDie = function(){
	return this.dead == 1;
}
/**
 * 玩家重新投票
 */
Player.prototype.reVote = function(){
	this.status = consts.PLAYER_STATUS.REVOTE;
}
/**
 * 玩家是否重新投票
 */
Player.prototype.isReVote = function(){
	return this.status == consts.PLAYER_STATUS.REVOTE;
}
/**
 * 玩家是否重新投票
 */
Player.prototype.setUndercover = function(){
	this.ucFlag = 1;
}
/**
 * 玩家是否重新投票
 */
Player.prototype.isUndercover = function(){
	return this.ucFlag == 1;
}
/**
 * 改变玩家状态
 * @param playerStatus
 */
Player.prototype.changeStatus = function(playerStatus){
	this.status == playerStatus;
}
/**
 * 玩家状态匹配
 * @param playerStatus
 * @returns {boolean}
 */
Player.prototype.equalsStatus = function(playerStatus){
	return this.status == playerStatus;
}
/**
 * 重置投票状态
 */
Player.prototype.resetVote = function(){
	this.votes = 0;
	this.hasVoted = 0;
	this.targetId = 0;
	this.said = 0;
	this.sayContent = "";
}

/**
 * 获取用户信息
 * @returns {*}
 */
Player.prototype.getUser = function(){
	return DataManager.getUser(this.userId);
}

module.exports=Player;
