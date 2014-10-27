/**
 * created by pingshi 13-11-26
 * 用户信息类
 * 一个帐号对应一个用户实体,用于登录认证,以及保管用户状态信息
 */
var logger=require('pomelo-logger').getLogger(__filename);
var util=require('util');
var events=require('events');
var cacheConfig=require('../../../core/cache/consts');
var consts=require('../consts/consts');
var idCreater = require('../services/idCreater');
var Persistent = require('../../../core/domain/persistent');
var DomainEventManager = require('../../../core/domain/eventMgr');
var DataManager=require('../manager/dataManager');
var domainEventManager = new DomainEventManager();

function User(){
    this.userId = '';//用户id
    this.userName = "";//用户昵称
    this.status = -1;//用户状态(已经登录,已经离线,60s自动回收内存,回写)
	this.oltimes = 0;
    Persistent.call(this);
    domainEventManager.addSaveEvent(this);
}

util.inherits(User, Persistent);

User.create = function(userName){
	logger.info('创建用户:_createUser');
	var userId = idCreater.createUserId();//随机生成一个userId
	var user = new User();//新增玩家
	user.userId = userId;//userId
	user.userName = userName;//玩家昵称
	user.saveRightNow();
	logger.info('用户:'+user.userId+" 用户名:"+user.userName);
	return user;
}

User.prototype.getDocument = function(){
    return {
        collectionName: this.getCollectionName,
        doc: {
            userId: this.userId,
            userName: this.userName
        }
    }
}

User.prototype.online = function(){
	this.status = consts.USER_STATUS.ONLINE;
	this.oltimes = 0;
}

User.prototype.isOnline = function(){
	return this.status == consts.USER_STATUS.ONLINE;
}

User.prototype.offline = function(){
	this.status = consts.USER_STATUS.OFFLINE;
}

User.prototype.destroy = function(){
	DataManager.deleteUser(this.userId);
}

User.prototype.isTimeout = function(){
	if(this.oltimes >= consts.SYSTEM.OFFLINE_TIME_OUT){
		return true;
	}
}

User.prototype.gainTime = function(){
	this.oltimes++;
}

User.prototype.getCollectionName = 'user';

// 返回redis所需要的key
User.prototype.getDefaultKey = function(){
    return this.getCollectionName + cacheConfig.REDIS.KEY_SEPARATOR + this.userId;
}

module.exports=User;