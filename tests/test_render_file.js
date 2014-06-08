var assert = require('assert');
var vejs = require('../index.js');

var vows = require('vows');

vejs.funcs.testing_function1 = function(arg) {
	return arg;
}

vows.describe('Test suite for rendering template file').addBatch({
	
	renderTemplateFile: {
		topic : function() {
			vejs.renderFile('./tests/data/template.html', {locals:{first:2}}, this.callback);
		},
		'should return output "2 <div>Testing</div>first = 2  <script>var test = {"first":2}; </script>"': function(err, output) {
			assert.equal(output, '2 <div>Testing</div>first = 2  <script>var test = {"first":2}; </script>');
		}
	}
}).export(module);