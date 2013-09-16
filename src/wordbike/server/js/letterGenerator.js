var fs = Npm.require('fs');

var letterGenerator = function() {
	var text = fs.readFileSync('letterDistribution.json', 'utf8');
	return JSON.parse(text);
};
