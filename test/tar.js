#!/usr/bin/env node
(function () {
	'use strict';

	var fs = require('fs'),
		Tar = require('tar-async'), // or require('tar-async').Tar or require('tar-async/tar')
		tape,
		contents,
		stats;

	contents = fs.readFileSync('./tar.js', 'utf8');

	tape = new Tar({output: require('fs').createWriteStream('out.tar')});

	stats = fs.lstatSync('./tar.js');

	tape.append('waja.js', contents);
	tape.append('piped.js', fs.createReadStream('./tar.js', {encoding: 'utf8'}), {size: stats.size});
	tape.append('justText.txt', 'This is just some text. Fun, huh?', function () {
		tape.close();
	});
}());
