#!/usr/bin/env node
(function () {
	'use strict';

	var fs = require('fs'),
		Untar = require('../lib/index').Untar,
		untar = new Untar(function (err, header, fileStream) {
			if (err) {
				return;
			}

			console.log(header.filename);
			fileStream.on('data', function (data) {
				console.log(data.toString());
			});
			fileStream.on('end', function () {
				// whatever...
			});
		});

	fs.createReadStream('./out.tar').pipe(untar);
}());
