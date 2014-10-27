// require json files
var keywords = require('../../config/data/keywords');
var actionTypes = require('../../config/data/actionTypes');
var actions = require('../../config/data/actions');
var questions = require('../../config/data/questions');

/**
 * Data model `new Data()`
 *
 * @param {Array}
 *
 */
var Data = function(data) {
	this.array = data;
	var fields = {};
	data[1].forEach(function(i, k) {
		fields[i] = k;
	});
	data.splice(0, 2);

	var result = {}, item;
	data.forEach(function(k) {
		item = mapData(fields, k);
		result[item.id] = item;
	});

	this.data = result;
};

/**
 * map the array data to object
 *
 * @param {Object}
 * @param {Array}
 * @return {Object} result
 * @api private
 */
var mapData = function(fields, item) {
	var obj = {};
	for (var k in fields) {
		obj[k] = item[fields[k]];
	}
	return obj;
};

/**
 * find items by attribute
 *
 * @param {String} attribute name
 * @param {String|Number} the value of the attribute
 * @return {Array} result
 * @api public
 */
Data.prototype.findBy = function(attr, value) {
	var result = [];
	var i, item;
	for (i in this.data) {
		item = this.data[i];
		if (item[attr] == value) {
			result.push(item);
		}
	}
	return result;
};

Data.prototype.findBigger = function(attr, value) {
	var result = [];
	value = Number(value);
	var i, item;
	for (i in this.data) {
		item = this.data[i];
		if (Number(item[attr]) >= value) {
			result.push(item);
		}
	}
	return result;
};

Data.prototype.findSmaller = function(attr, value) {
	var result = [];
	value = Number(value);
	var i, item;
	for (i in this.data) {
		item = this.data[i];
		if (Number(item[attr]) <= value) {
			result.push(item);
		}
	}
	return result;
};

/**
 * find item by id
 *
 * @param id
 * @return {Obj}
 * @api public
 */
Data.prototype.findById = function(id) {
	return this.data[id];
};

/**
 * find all item
 *
 * @return {array}
 * @api public
 */
Data.prototype.all = function() {
	return this.data;
};

/**
 * 随机获取一个
 * @param cb
 */
Data.prototype.getRandom = function () {
	var index = Math.floor(Math.random() * this.array.length);
	return this.data[index];
}

module.exports = {
	keywords: new Data(keywords),
	actionTypes: new Data(actionTypes),
	actions: [
		new Data(actions[0]),
		new Data(actions[1]),
		new Data(actions[2]),
		new Data(actions[3]),
		new Data(actions[4])
	],
	questions: new Data(questions)
};
