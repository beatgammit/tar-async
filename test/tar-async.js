#!/usr/bin/env node
(function () {
	'use strict';

	var fs = require('fs'),
		path = require('path'),
		forEachAsync = require('forEachAsync'),
		Tar = require('../lib');

	function tarDir(cb, dir, tape) {
		fs.readdir(dir, function (err, files) {
			files = files.sort();

			console.log('Files:', files);

			forEachAsync(files, function (next, file) {
				var fullPath = path.join(dir, file);

				console.log('File:', file);

				tape.append(file, fs.createReadStream(fullPath), {allowPipe: true}, next);
			}).then(function () {
				tape.close();
				cb(tape);
			});
		});
	}

	fs.readdir('.', function (err, files) {
		forEachAsync(files, function (next, file) {
			var stats = fs.statSync(file),
				tape;

			if (file !== 'node_modules' && stats.isDirectory()) {
				console.log('Dir:', file);
				tape = new Tar({output: fs.createWriteStream(file + '.tar')});

				tarDir(next, file, tape);
			} else {
				next();
			}
		}).then(function () {
			console.log('All done!');
		});
	});
}());
