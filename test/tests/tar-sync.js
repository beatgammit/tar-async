#!/usr/bin/env node
(function () {
	'use strict';

	var fs = require('fs'),
		path = require('path'),
		Tar = require('../../lib');

	function tarDir(dir, tape) {
		var files = fs.readdirSync(dir);

		files.forEach(function (file) {
			var fullPath = path.join(dir, file),
				contents = fs.readFileSync(fullPath);

			tape.append(file, contents);
		});
	}

  function run(cb, testDir, outDir) {
    if (typeof cb !== 'function') {
      cb = function () {};
    }

    fs.readdirSync(testDir).forEach(function (file) {
      var fullPath = path.join(testDir, file),
          stats = fs.statSync(fullPath),
          outPath = path.join(outDir, file + '.tar'),
          tape;

      if (file !== 'node_modules' && stats.isDirectory()) {
        tape = new Tar({output: fs.createWriteStream(outPath)});

        tarDir(fullPath, tape);
      }
    });

    cb();
  }

  if (require.main === module) {
    run(null, '../test-sets', '.');
  }

  module.exports = run;
}());
