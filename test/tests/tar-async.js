#!/usr/bin/env node
(function () {
	'use strict';

	var fs = require('fs'),
		path = require('path'),
		forEachAsync = require('forEachAsync'),
		Tar = require('../../lib');

	function tarDir(cb, dir, tape) {
		fs.readdir(dir, function (err, files) {
			files = files.sort();

			forEachAsync(files, function (next, file) {
				var fullPath = path.join(dir, file);

				tape.append(file, fs.createReadStream(fullPath), {allowPipe: true}, next);
			}).then(function () {
				tape.close();
				cb();
			});
		});
	}

  function run(cb, testDir, outDir) {
    if (typeof cb !== 'function') {
      cb = function () {};
    }

    fs.readdir(testDir, function (err, files) {
      forEachAsync(files, function (next, file) {
        var fullPath = path.join(testDir, file),
          outPath = path.join(outDir, file + '.tar'),
          stats = fs.statSync(fullPath),
          tape;

        if (file !== 'node_modules' && stats.isDirectory()) {
          tape = new Tar({output: fs.createWriteStream(outPath)});

          tarDir(next, fullPath, tape);
        } else {
          next();
        }
      }).then(function () {
        cb();
      });
    });
  }

  if (require.main === module) {
    run(null, '../test-sets', '.');
  }

  module.exports = run;
}());
