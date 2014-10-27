/**
 * Created by yang_ruidong on 13-11-18.
 * 把卧底的关键字存储于数据库中，实现了和代码分离
 */
var util = require('util');
var dataApi = require('../../../utils/dataApi');
var app = require('pomelo').app;
var consts=require('../consts/consts');

function Keyword(word1, word2) {
    this.word1 = word1;
    this.word2 = word2;
}

Keyword.create = function(){
	var keywords = dataApi.keywords.getRandom();
	var keyword = new Keyword(keywords.word1, keywords.word2);
	return keyword;
}

Keyword.prototype.getData = function(){
	return [this.word1, this.word2]
}

module.exports = Keyword;