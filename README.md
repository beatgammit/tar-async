Intro
=====

Tar-async is an async approach to Tar in node.

Tar-async does not directly use the filesystem at all. This makes it really easy to use for practically anything. All that's required to tar something is a filename and data.

No compression is used, so an external compression library is necessary.  This is by design and not likely to be implemented.

Example
=======

Tar:

	var Tar = require('tar-async').Tar,
		tape = new Tar({output: require('fs').createWriteStream('out.tar')});
	
	tape.append('test.txt', 'Woohoo!! Tar me up Scotty!', function () {
		tape.close();
	});

Simple huh? A Tar instance is an EventEmitter, and emits these events: 'end', 'data' (and maybe 'error' in the future)

Untar:

	var Untar = require('tar-async').Untar,
		fs = require('fs'),
		untar = new Untar(function (err, header, fileStream) {
			console.log(header.filename);
			fileStream.on('data', function (data) {
				console.log(data.toString());
			});
		});

	fs.createReadStream('out.tar').pipe(untar);

Untar is a Writable Stream, so it's pretty easy to asynchronously untar something.

API
===

Ok, so you want more detail.  Here ya go:

Tar
---

Tar(opts)

Supported options include:

* recordsPerBlock- number of records in a block, default is 20 (don't change unless you know what you're doing)
* consolidate- default false; whether to consolidate everything into a single directory
* normalize- default true; whether to normalize each file's path
* output- default null; writable stream to stream output to

Tar.append(filepath, input, opts, callback):

* filepath- filepath for file when extracted
* input- string or Buffer
* opts- optional options
  * mode- permissions on the file (default 777)
  * mtime- last modified time in seconds (default current time)
  * uid- owner id (default 0)
  * gid- group id (default 0)
  * size- size of output (default input.length; changing this could lead to bad results)
* callback- optional callback; no parameters; called when a record is written

Untar
-----

Untar(opts, callback)

* opts- not used, but slated for future use
* callback- callback each time a record is read; parameters are
  * err- only used when checksums don't match
  * header- header data (see `header.js` for details
  * fileStream- Readable Stream; chunks will be emitted as Buffer objects
