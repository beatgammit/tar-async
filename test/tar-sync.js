#!/usr/bin/env node
(function () {
	'use strict';

	var fs = require('fs'),
		path = require('path'),
		Tar = require('../lib'),
		tape;

	function tarDir(dir, tape) {
		var files = fs.readdirSync(dir);

		files.forEach(function (file) {
			var fullPath = path.join(dir, file),
				contents = fs.readFileSync(fullPath);

			tape.append(file, contents);
		});
	}

	fs.readdirSync('.').forEach(function (file) {
		var stats = fs.statSync(file);

		if (stats.isDirectory()) {
			console.log(file);

			tape = new Tar({output: fs.createWriteStream(file + '.tar')});

			tarDir(file, tape);
		}
	});
}());
