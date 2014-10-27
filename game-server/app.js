var pomelo = require('pomelo');
var sync = require('pomelo-sync-plugin');
var consts = require('./app/core/cache/consts')
/**
 * Init app for client.
 */
var app = pomelo.createApp();
app.set('name', 'party');
app.set('connectorConfig',
	{
		connector : pomelo.connectors.hybridconnector,
//		connector : pomelo.connectors.sioconnector
		heartbeat : 10,
		useDict : true,
		useProtobuf : true,
		handshake : function(msg, cb){
			cb(null, {});
		}
	});
app.configure('development', 'game', function(){
	var Tasker = require('./app/task/tasker');
	var tasker = new Tasker();
	app.set('tasker', tasker);
});
// Configure database
app.configure('development', 'db', function() {
    var Db = require('./app/core/db/mongodb/db');
    var dbclient = new Db();
    app.set('dbclient', dbclient);
    app.use(sync, {sync: {path:__dirname + '/app/game/wodi/mapping', dbclient: dbclient, interval: consts.REDIS.QUEUE_INTERVAL}});
});

app.start();

process.on('uncaughtException', function (err) {
  console.error(' Caught exception: ' + err.stack);
});