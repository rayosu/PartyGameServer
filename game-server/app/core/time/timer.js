/**
 * Created by surui on 14-2-14.
 * 定时器
 */
var logger=require('pomelo-logger').getLogger(__filename);

function Timer(){

}

var tasks = {};

Timer.delay = function( id, cb, delay){
	logger.info('增加延时回调:'+id);
	var task = setTimeout(function(cb, tasks, id, params){
		logger.info("timeout callback is run: "+id);
		cb.apply(null, params);
		delete tasks[id];
	}, delay, cb, tasks, id, Array.prototype.slice.call(arguments, 3));
	tasks[id] = task;
}

Timer.cancel = function( id ){
	logger.info('取消延时回调:'+id);
	var task = tasks[id];
	if(task != null){
		try{
			clearTimeout(task);
			delete tasks[id];
		} catch (err){
			logger.info(err.data);
		}
	}
}

module.exports=Timer;