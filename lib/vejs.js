var fs = require('fs');

var funcs = {};
var filters = {
	json : function(obj){
		return JSON.stringify(obj);
	}
};

var cache = {};

function filtered(js) {
	return js.substr(1).split('|').reduce(function(js, filter){
		var parts = filter.split(':')
				, name = parts.shift()
				, args = parts.shift() || '';
		if (args) args = ', ' + args;
		return 'filters.' + name + '(' + js + args + ')';
	});
};
	
var parse = function(str, options) {
	var options = options || {}
	, open = options.open || module.exports.open || '<%'
	, close = options.close || module.exports.close || '%>',
	eatspace = true, whitespaceLast = false, closeMarkupLast = false;
	if (options.hasOwnProperty('eatspace')) {
		eatspace = options.eatspace;
	};

	var buf = ["var buf = [];"
			   , "\nwith (locals) {"
			   , "\n  buf.push('"
			   ];
	var lineno = 1;
	var consumeEOL = false;
	var i, len, end, js, start, n;
	
	for (i = 0, len = str.length; i < len; ++i) {
		if (str.slice(i, open.length + i) == open) {
			i += open.length;
			var prefix, postfix, line = '__stack.lineno=' + lineno;
			switch (str.substr(i, 1)) {
				case '=':
					prefix = "', escape((" + line + ', ';
					postfix = ")), '";
					++i;
					break;
				case '-':
					prefix = "', (" + line + ', ';
					postfix = "), '";
					++i;
					break;
				default:
					prefix = "');" + line + ';';
					postfix = "; buf.push('";
			}

			end = str.indexOf(close, i);
			js = str.substring(i, end);
			start = i;
			n = 0;
	
			if ('-' == js[js.length-1]){
				js = js.substring(0, js.length - 2);
				consumeEOL = true;
			}
	
			while (~(n = js.indexOf("\n", n))) n++, lineno++;
			if (js.substr(0, 1) == ':') js = filtered(js);
			
			js = js.replace(/&(?=[\w.]+\()/g,'funcs.');
			
			buf.push(prefix, js, postfix);
			i += end - start + close.length - 1;

		} else if (str.substr(i, 1) == "\\") {
			buf.push("\\\\");
			closeMarkupLast = false;
		} else if (str.substr(i, 1) == "'") {
			buf.push("\\'");
			closeMarkupLast = false;
		} else if (str.substr(i, 1) == "\r") {
			if (eatspace) {
				buf.push("");
			} else {
				buf.push(" ");
				whitespaceLast = true;
			}
		} else if (str.substr(i, 1) == "\t") {
			if (!eatspace) {
				buf.push("\\t");
				whitespaceLast = true;
			}
		} else if (str.substr(i, 1) == "\n") {
			if (consumeEOL) {
				consumeEOL = false;
			} else {
				if (eatspace) {
					if (closeMarkupLast) {
						buf.push("");
					} else {
						buf.push(" ");
						whitespaceLast = true;
						closeMarkupLast = false;
					}
				} else {
					buf.push("\\n");
				}
				lineno++;
			}
		} else {
			if (str.substr(i, 1) == ' ') {
				if (whitespaceLast) {
					continue;
				} else {
					whitespaceLast = true;
				}
			} else {
				whitespaceLast = false;
			}
			if (str.substr(i, 1) == '>') {
				closeMarkupLast = true;
			} else {
				closeMarkupLast = false;
			}
			buf.push(str.substr(i, 1));
 	   }
	}
	
	buf.push("');\n}\nreturn buf.join('');");
	return buf.join('');
};

var _escape = function(text) {
	return String(text)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
};

function rethrow(err, str, filename, lineno) {
	var lines = str.split('\n')
			, start = Math.max(lineno - 3, 0)
			, end = Math.min(lines.length, lineno + 3);

	var context = lines.slice(start, end).map(function(line, i) {
		var curr = i + start + 1;
		return (curr == lineno ? ' >> ' : '    ') + curr + '| ' + line;
	}).join('\n');
	
	err.path = filename;
	err.message = (filename || 'undefined') + ':' + lineno + '\n' + context + '\n\n' + err.message;
	
	throw err;
}

var compile = function(str, options) {
	options = options || {};
	var input = JSON.stringify(str)
			, filename = options.filename
			? JSON.stringify(options.filename) : 'undefined';
	
	str = [
		'var __stack = { lineno: 1, input: ' + input + ', filename: ' + filename + ' };',
		rethrow.toString(),
		'try {',
		parse(str, options),
		'} catch (err) {',
		'  rethrow(err, __stack.input, __stack.filename, __stack.lineno);',
		'}'
		].join("\n");
		
	if (options.debug) {
		console.log(str);
	}
	
	var fn = new Function('locals, filters, funcs, escape', str);
	
	return function(locals) {
		return fn.call(this, locals, filters, funcs, _escape);
	};
};

var render = exports.render = function(str, options){
	var fn, options = options || {};
	if (options.cache) {
		if (options.filename) {
			fn = cache[options.filename] || (cache[options.filename] = compile(str, options));
		} else {
			throw new Error('"cache" option requires "filename".');
		}
	} else {
		fn = compile(str, options);
	}

	options.__proto__ = options.locals;
	return fn.call(options.scope, options);
};

var renderFile = exports.renderFile = function(path, options, callback){
	var key = path + ':string';
	if ('function' == typeof options) {
		callback = options, options = {};
	}
	options.filename = path;
	try {
		var str = options.cache ? cache[key] || (cache[key] = fs.readFileSync(path, 'utf8')) : fs.readFileSync(path, 'utf8');
		callback(null, render(str, options));
	} catch (err) {
		callback(err);
	}
};

var express = function(path, options, callback) {
	var layout;
	if (options.layout) {
		renderFile(path, options, function(err, content) {
			if (err) {
				return callback(err);
			}
			layout = options.settings.views + '/' + options.layout;
			options.body = content;
			renderFile(layout, options, callback);
		});
	} else {
		renderFile(path, options, callback);
	}
};

module.exports = {
	open: '<%',
	close: '%>',
	filters: filters,
	funcs: funcs,
	parse : parse,
	compile : compile,
	__express: express
};
