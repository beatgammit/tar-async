#!/usr/bin/env node
(function () {
	'use strict';

	var fs = require('fs'),
		Untar = require('../../lib/untar'), // or require('tar-async').Untar
		untar = new Untar(function (err, header, fileStream) {
			if (err) {
				return;
			}

			fileStream.on('data', function (data) {
				console.log(data.toString());
			});
			fileStream.on('end', function () {
				// whatever...
			});
		});

  function run(cb, testDir) {
    var stream;

    if (typeof cb !== 'function') {
      cb = function () {};
    }

    stream = fs.createReadStream('./out.tar');
    stream.on('end', cb);
    stream.on('error', cb);

    stream.pipe(untar);
  }

  if (require.main === module) {
    run();
  }

  module.exports = run;
}());
