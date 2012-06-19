#!/usr/bin/env node
(function () {
	'use strict';

	var fs = require('fs'),
		path = require('path'),
		Tar = require('../lib');

	function tarDir(cb, dir, tape) {
		fs.readdir(dir, function (err, files) {
			files.forEachfunction (file) {
				var fullPath = path.join(dir, file),
					stream = fs.createReadStream(fullPath);

				tape.append(file, stream, next);
			});
		});
	}

	fs.readdirSync('.').forEach(function (file) { {
		var stats = fs.statSync(file),
			tape;

		if (stats.isDirectory()) {
			console.log('Dir:', file);
			tape = new Tar({output: fs.createWriteStream(file + '.tar')});

			tarDir(function() {}, file, tape);
		}
	}).then(function () {
		console.log('All done!');
	});
}());
