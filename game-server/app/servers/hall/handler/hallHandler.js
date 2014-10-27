/**
 * created by surui on 13-11-26
 * 聚会嘉年华大厅服务器
 */
var logger = require('pomelo-logger').getLogger(__filename);

module.exports = function(app){
    return new HallHandler(app);
};

var HallHandler = function(app){
    this.app = app;
};

HallHandler.prototype.check = function(msg, session, next){
	logger.info('check connection');
	next(null, {code:200});
}
//, "clientPort": 3210, "frontend": true

/**
 * 建立大厅连接
 * @param msg
 * @param session
 * @param next
 */
HallHandler.prototype.login = function(msg,session,next){
    // TODO 这里负责聚会嘉年华大厅相关处理
	logger.info("msg:"+JSON.stringify(msg));
    var serverId = this.app.get('serverId');
    session.set('sid', serverId);
    session.push('sid', function(err) {
        if(err) {
            console.error('set sid for session service failed! error is : %j', err.stack);
        }
    });
//    console.log('----------------------------------------------->', session, serverId);
    logger.info('成功连接:'+serverId);
	msg['cmd'] = 'login';
	msg['serverId'] = serverId;
	this.app.rpc.game.ucRemote.login(session, msg, function(err, msg){
		logger.info('remote callback!');
		logger.info(msg.code);
		// 登录成功
		if(msg.code == 200){
			logger.info('hall登录成功!');
			var userId = msg.data.userId;
			if(!userId){
				logger.error('userId为空,无法绑定session');
			}
			session.bind(userId);
			next(null, msg);
		} else {
			logger.info('hall登录失败!');
			next(null, {code:-1000});
		}
	});
    session.on('closed', onUserOffline.bind(null, this.app));
//    next(null, msg);
}

var onUserOffline = function(app, session) {
    console.log('offline');
    if(!session || !session.uid) {
        return;
    }
    logger.info('用户掉线:'+session.uid);
   //远程通知
    app.rpc.game.ucRemote.offline(session, {userId:session.uid, destroyRoom:0}, null);
};

// test
HallHandler.prototype.test = function(msg,session,next){
    console.log('------------------------------->test');
    var User = require('../../../game/wodi/domain/user');
    var user = new User();
    user.id = 'undefined';
    user.name = 'xx';
//    user.get(function(err, data){
//        console.log('------------------------------->', err, data);
//    })
    user.saveRightNow();
}