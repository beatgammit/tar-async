(function () {
	"use strict";

	var path = require('path'),
		Stream = require('stream').Stream,
		header = require("./header"),
		utils = require("./utils"),
		recordSize = 512,
		blockSize,
		queue = [];
	
	function Tar(opt) {
		var tape;

		opt = opt || {};

		blockSize = (opt.recordsPerBlock ? opt.recordsPerBlock : 20) * recordSize;

		Stream.apply(this, arguments);

		tape = this;

		this.written = 0;

		this.consolidate = 'consolidate' in opt ? opt.consolidate : false;
		this.normalize = 'normalize' in opt ? opt.normalize : true;

		this.on('end', function () {
			tape.emit('data', utils.clean(blockSize - (tape.written % blockSize)));
			this.written += blockSize - (tape.written % blockSize);
		});

		if (opt && opt.output) {
			this.pipe(opt.output);
		}
	}

	Tar.prototype = Object.create(Stream.prototype, {
		constructor: { value: Tar }
	});

	Tar.prototype.close = function () {
		this.emit('end');
	};

	Tar.prototype.createHeader = function (data) {
		var checksum,
			i,
			length,
			headerBuf;

		if (this.normalize && !this.consolidate) {
			data.filename = path.normalize(data.filename);
		}

		// format the header without the checksum
		headerBuf = header.format(data);

		// calculate the checksum
		checksum = 0;
		for (i = 0, length = headerBuf.length; i < length; i += 1) {
			checksum += headerBuf[i];
		}

		// pad the checksum
		checksum = checksum.toString(8);
		while (checksum.length < 6) {
			checksum = '0' + checksum;
		}

		// write the checksum into the header
		for (i = 0, length = 6; i < length; i += 1) {
			headerBuf[i + 148] = checksum.charCodeAt(i);
		}
		headerBuf[154] = 0;
		headerBuf[155] = 0x20;

		return headerBuf;
	};

	Tar.prototype.writeData = function (callback, header, input, size) {
		var extraBytes,
			tape = this;

		// and write it out to the stream
		this.emit('data', header);
		this.written += header.length;

		// if it's a string/Buffer, we can just write it out to the stream
		if (typeof input === 'string' || input instanceof Buffer) {
			this.emit('data', input);
			this.written += input.length;

			extraBytes = recordSize - (size % recordSize || recordSize);
			this.emit('data', utils.clean(extraBytes));
			this.written += extraBytes;

			return callback();
		} else {
			// otherwise we need to do it asynchronously
			this.processing = true;

			input.on('data', function (chunk) {
				tape.emit('data', chunk);
				tape.written += chunk.length;
			});

			input.on('end', function () {
				extraBytes = recordSize - (size % recordSize || recordSize);
				tape.emit('data', utils.clean(extraBytes));
				tape.written += extraBytes;

				tape.processing = false;

				if (queue.length > 0) {
					process.nextTick(function () {
						var job = queue.shift();

						if (typeof job.input === 'object' && typeof job.input.resume === 'function') {
								job.input.resume();
						}

						tape.append(job.filepath, job.input, job.opts, job.cb);
					});
				}

				return callback();
			});
		}
	};

	Tar.prototype.append = function (filepath, input, opts, callback) {
		var data,
			mode,
			mtime,
			uid,
			gid,
			size,
			tape = this;

		if (typeof opts === 'function') {
			callback = opts;
			opts = {};
		}

		if (typeof callback !== 'function') {
			callback = function (err, data) {
				if (err) {
					throw err;
				}

				return data;
			};
		}

		if (this.processing || queue.length) {
			if (typeof input === 'object' && typeof input.pause === 'function') {
					input.pause();
			}

			queue.push({
				filepath: filepath,
				input: input,
				opts: opts,
				cb: callback
			});
			return;
		}

		opts = opts || {};

		mode = typeof opts.mode === 'number' ? opts.mode : parseInt('777', 8) & 0xfff;
		mtime = typeof opts.mtime === 'number' ? opts.mtime : parseInt(+new Date() / 1000);
		uid = typeof opts.uid === 'number' ? opts.uid : 0;
		gid = typeof opts.gid === 'number' ? opts.gid : 0;
		size = typeof opts.size === 'number' ? opts.size : input.length;

		// if you give me a stream, you must tell me how big it is
		// since the header comes first, the only other solution is to
		// cache the entire file before writing it out to a stream,
		// which completely invalidates the purpose of a stream
		if (input instanceof Stream && (typeof size !== 'number' || size < 0)) {
			if (opts.allowPipe) {
				size = -1;
			} else {
				console.error('Error:', size);
				return callback(new Error('Streams must supply the total size of the stream if allowPipe is not set.'));
			}
		}

		data = {
			filename: this.consolidate ? path.basename(filepath) : filepath,
			mode: utils.pad(mode, 7),
			uid: utils.pad(uid, 7),
			gid: utils.pad(gid, 7),
			size: utils.pad(size, 11),
			mtime: utils.pad(mtime, 11),
			checksum: '        ',
			type: '0', // just a file
			ustar: 'ustar ',
			owner: '',
			group: ''
		};

		if (size === -1 && opts.allowPipe) {
			this.processing = true;
			utils.readAll(function (err, buf) {
				tape.processing = false;

				size = buf.length;
				data.size = utils.pad(size, 11);
				tape.writeData(callback, tape.createHeader(data), buf, size);
			}, input);
		} else {
			this.writeData(callback, this.createHeader(data), input, size);
		}
	};
	
	module.exports = Tar;
}());
