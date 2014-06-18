var assert = require('assert');
var vejs = require('../index.js');

var vows = require('vows');

vows.describe('Test suite for parsing template').addBatch({
	parseFunctionWithoutOutput : function() {
		var expected = "var buf = [];";
        expected += "\nwith (locals) {";
        expected += "\n  buf.push('');__stack.lineno=1; if (first) { funcs.func1()}; buf.push('');";
        expected += "\n}\n";
        expected += "return buf.join('');";
        
		assert.equal(vejs.parse('<% if (first) { &func1()}%>'), expected);
	},
	parseFunctionOutputWithEscape : function() {
		var expected = "var buf = [];";
        expected += "\nwith (locals) {";
        expected += "\n  buf.push('', escape((__stack.lineno=1,  funcs.func1())), '');";
        expected += "\n}\n";
        expected += "return buf.join('');";
		assert.equal(vejs.parse('<%= &func1()%>'), expected);
	},
	parseFunctionOutpuWithoutEscape : function() {
		var expected = "var buf = [];";
        expected += "\nwith (locals) {";
        expected += "\n  buf.push('', (__stack.lineno=1,  funcs.func1()), '');";
        expected += "\n}\n";
        expected += "return buf.join('');";
		assert.equal(vejs.parse('<%- &func1()%>'), expected);
	},
	parseMethodOutpuWithoutEscape : function() {
		var expected = "var buf = [];";
        expected += "\nwith (locals) {";
        expected += "\n  buf.push('', (__stack.lineno=1,  funcs.obj.func1()), '');";
        expected += "\n}\n";
        expected += "return buf.join('');";
		assert.equal(vejs.parse('<%- &obj.func1()%>'), expected);
	},
	parseOptionOpenClose : function() {
		var expected = "var buf = [];";
        expected += "\nwith (locals) {";
        expected += "\n  buf.push('', (__stack.lineno=1,  funcs.obj.func1() ), '');";
        expected += "\n}\n";
        expected += "return buf.join('');";
		assert.equal(vejs.parse('{{- &obj.func1() }}', {open: '{{', close: '}}'}), expected);	
	},
	parseModuleOpenClose : function() {
		var expected = "var buf = [];";
        expected += "\nwith (locals) {";
        expected += "\n  buf.push('', (__stack.lineno=1,  funcs.obj.func1() ), '');";
        expected += "\n}\n";
        expected += "return buf.join('');";
        vejs.open = '{{';
        vejs.close = '}}';
		assert.equal(vejs.parse('{{- &obj.func1() }}'), expected);	
		vejs.open = '<%';
        vejs.close = '%>';
	}
	
}).export(module);