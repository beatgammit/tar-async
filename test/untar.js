(function () {
	'use strict';

	var fs = require('fs'),
		untar = require('../lib/untar');

	untar(fs.createReadStream('./out.tar'), function (err, header, filedata) {
		if (err) {
			return;
		}

		console.log(header.fileName);
		console.log(filedata.toString());
	});
}());
