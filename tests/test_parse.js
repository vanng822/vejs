var assert = require('assert');
var vejs = require('../index.js');

var vows = require('vows');

vows.describe('Test suite for parsing template').addBatch({
	parseFunctionWithoutOutput : function() {
		expected = "var buf = [];";
        expected += "\nwith (locals) {";
        expected += "\n  buf.push('');__stack.lineno=1; if (first) { funcs.func1()}; buf.push('');";
        expected += "\n}\n";
        expected += "return buf.join('');";
        
		assert.equal(vejs.parse('<% if (first) { &func1()}%>'), expected);
	},
	parseFunctionOutputWithEscape : function() {
		expected = "var buf = [];";
        expected += "\nwith (locals) {";
        expected += "\n  buf.push('', escape((__stack.lineno=1,  funcs.func1())), '');";
        expected += "\n}\n";
        expected += "return buf.join('');";
		assert.equal(vejs.parse('<%= &func1()%>'), expected);
	},
	parseFunctionOutpuWithoutEscape : function() {
		expected = "var buf = [];";
        expected += "\nwith (locals) {";
        expected += "\n  buf.push('', (__stack.lineno=1,  funcs.func1()), '');";
        expected += "\n}\n";
        expected += "return buf.join('');";
		assert.equal(vejs.parse('<%- &func1()%>'), expected);
	}

}).export(module);