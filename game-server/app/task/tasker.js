/**
 * Created by surui on 13-12-27.
 */
//var logger=require('pomelo-logger').getLogger(__filename);
var taskConfigs = require('./config/task-config');
var path = require('path');

var Tasker = function(){

}

Tasker.prototype.start = function(app){
	console.log('定时服务器启动开始!');
	console.log('__dirname:'+__dirname);
	for(var id in taskConfigs){
		var config = taskConfigs[id];
		var runnerName = config['runner'];
		var timer = config['timer'];
		var runner = require(__dirname + '/runner/'+runnerName);
		//console.log('设置runner');
		setInterval(function(runner, id){
			//console.log('task [ '+id+' ] run');
			try{
				runner.run(app);
			} catch (err){
				console.dir(err);
			}
		},timer,runner, id)
	}
}

module.exports = Tasker;
