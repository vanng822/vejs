var assert = require('assert');
var vejs = require('../index.js');

var vows = require('vows');

// some simple control
vows.describe('Test suite for parsing template').addBatch({
	parseFunction : function() {
		expected = "var buf = [];";
        expected += "\nwith (locals) {";
        expected += "\n  buf.push('');__stack.lineno=1; if (first) { funcs.func1()}; buf.push('');";
        expected += "\n}\n";
        expected += "return buf.join('');";
        
		assert.equal(vejs.parse('<% if (first) { &func1()}%>'), expected);
	}
}).export(module);