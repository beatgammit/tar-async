(function () {
	'use strict';

	var fs = require('fs'),
		Untar = require('../lib/untar'),
		untar = new Untar(function (err, header, fileStream) {
			if (err) {
				return;
			}

			console.log(header.fileName);
			fileStream.on('data', function (data) {
				console.log(data.toString());
			});
			fileStream.on('end', function () {
				console.log('end of file');
			});
		});

	fs.createReadStream('./out.tar').pipe(untar);
}());
