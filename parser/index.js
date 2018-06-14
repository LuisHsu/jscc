//    Copyright 2018 Luis Hsu
//
//    Licensed under the Apache License, Version 2.0 (the "License");
//    you may not use this file except in compliance with the License.
//    You may obtain a copy of the License at
//
//        http://www.apache.org/licenses/LICENSE-2.0
//
//    Unless required by applicable law or agreed to in writing, software
//    distributed under the License is distributed on an "AS IS" BASIS,
//    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//    See the License for the specific language governing permissions and
//    limitations under the License.

const { Duplex } = require('stream');
const ExtDefs = require('./extDefs');

/** 語法解析器
 * @extends Duplex
 * @property {Object} genAST 產生的語法樹
 * @property {Array} tokens 輸入的詞彙
 * @property {String} 串流輸入的資料暫存字串
 */
class Parser extends Duplex {
	constructor(option) {
		super(option);
		this.clean();
		this.on('finish', this._unpipe);
	}
	/** 清除語法解析器的成員資料 */
	clean() {
		this.genAST = null;
		this.tokens = [];
		this.dataStr = "";
	}
	_write(data, encoding, callback) {
		this.dataStr += data.toString();
		try {
			var splited = this.dataStr.split('\n');
			try {
				for (var tokenStr = splited.shift(); splited.length > 0; tokenStr = splited.shift()) {
					if (tokenStr != "") {
						this.tokens.push(JSON.parse(tokenStr));
					}
				}
				this.dataStr = "";
			} catch (err) {
				if (splited.length == 0) {
					this.dataStr = tokenStr;
				} else {
					callback(err);
				}
			}
			callback(null);
		} catch (err) {
			callback(err);
		}
	}
	_read(){
		try{
			var timer = setInterval((() => {
				if(this.genAST){
					clearInterval(timer);
					this.push(JSON.stringify(this.genAST, null, "  "));
					this.emit('end');
				}
			}).bind(this), 1);
		}catch(err){
			this.emit('error', err);
		}
	}
	_unpipe(){
		var splited = this.dataStr.split('\n');
		for (var tokenStr = splited.shift(); splited.length > 0; tokenStr = splited.shift()) {
			if (tokenStr != "") {
				this.tokens.push(JSON.parse(tokenStr));
			}
		}
		// Parse
		var context = {
			typedefs: []
		};
		this.tokens.cursor = 0;
		this.genAST = ExtDefs.translation_unit(context, this.tokens);
		if(this.genAST == null){
			this.genAST = "Error"; // FIXME: Detailed error message
		}
	}
}
module.exports = new Parser();
