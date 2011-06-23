(function () {
	'use strict';

	var fs = require('fs'),
		Tar = require('../lib/tar'),
		tape,
		contents,
		stats;

	contents = fs.readFileSync('./nofs.js', 'utf8');

	tape = new Tar({output: require('fs').createWriteStream('out.tar')});

	stats = fs.lstatSync('./nofs.js');

	tape.append('waja.js', contents);
	tape.append('piped.js', fs.createReadStream('./nofs.js', {encoding: 'utf8'}), {size: stats.size});
	tape.append('justText.txt', 'This is just some text. Fun, huh?', function () {
		tape.close();
	});
}());
