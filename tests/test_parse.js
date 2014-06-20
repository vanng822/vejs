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
	},
	parseWithJsOnlineComment: function() {
		var expected = "var buf = [];";
		expected += "\nwith (locals) {";
		expected += "\n  buf.push('<div>first div</div><script>/* comment 1 */</script><p>p</p><script type=\"text/javascript\">var t = 1; /* comment 2 */ var nvar=2;</script><div>', (__stack.lineno=3,  funcs.obj.func1() ), '</div>');";
		expected += "\n}\n";
		expected += "return buf.join('');";
		var output = vejs.parse('<div>first div</div><script>//comment 1</script>\n<p>p</p><script type="text/javascript">var t = 1; //comment 2\n var nvar=2;</script><div><%- &obj.func1() %></div>');
		assert.equal(output, expected);	
	}
}).export(module);