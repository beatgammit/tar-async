(function () {
	"use strict";

	var events = require('events'),
		headerFormat = require('./header').structure,
		emitter,
		buffer,
		header,
		fileData,
		offset = 0,
		totalRead = 0,
		recordSize = 512;

	function readInt(value) {
		return parseInt(value.replace(/^0*/, ''), 8) || 0;
	}

	function readString(buf) {
		var i, length;
		for (i = 0, length = buf.length; i < buf.length; i += 1) {
			if (buf[i] === 0) {
				return buf.toString('utf8', 0, i);
			}
		}
	}

	function doHeader(buf, cb) {
		var data = {}, offset = 0, checksum = 0, tBuf;

		function updateChecksum(value) {
			var i, length;

			for (i = 0, length = value.length; i < length; i += 1) {
				checksum += value.charCodeAt(i);
			}
		}

		headerFormat.some(function (field) {
			var tBuf = buf.slice(offset, offset + field.length),
				tString = tBuf.toString();

			offset += field.length;

			if (field.field === 'ustar' && !/ustar/.test(tString)) {
				// end the loop if not using the extended header
				return true;
			} else if (field.field === 'checksum') {
				updateChecksum('        ');
			} else {
				updateChecksum(tString);
			}

			if (field.type === 'string') {
				data[field.field] = readString(tBuf);
			} else if(field.type === 'number') {
				data[field.field] = readInt(tString);
			}
		});

		if (typeof cb === 'function') {
			if (checksum !== data.checksum) {
				return cb('Checksum not equal', checksum, data.checksum);
			}
			cb(null, data, recordSize);
		}
	}

	function readFile(cb) {
		var fileData = buffer.slice(0, header.fileSize);

		// update running total
		totalRead += fileData.length;

		cb(null, header, fileData);

		// clear header
		header = undefined;
		// adjust header
		buffer = buffer.slice(fileData.length);

		process.nextTick(function () {
			doFile(cb);
		});
	}

	function doFile(buf, cb) {
		var data, tOffset = 0, numBlocks, fileData, tBuf, bytesBuffer;

		// no data, we'll try to clean up
		if (!buf || typeof buf === 'function') {
			cb = buf || cb;
			buf = undefined;
			tBuf = buffer;
		} else if (buffer) {
			// create new buffer with old and new data
			tBuf = new Buffer(buffer.length + buf.length);
			buffer.copy(tBuf);
			buf.copy(tBuf, buffer.length);
		} else {
			tBuf = buf;
		}

		// clear old buffer
		buffer = undefined;

		// nothing to do, just give up ='(
		if (!tBuf) {
			return;
		}

		// if we've already read the header, try to read the file data
		if (header) {
			if (tBuf.length >= header.fileSize) {
				return readFile(cb);
			} else {
				buffer = tBuf;
				return;
			}
		}

		// if we're not an even multiple, account for trailing nulls
		if (totalRead % recordSize) {
			bytesBuffer = recordSize - (totalRead % recordSize);

			// if we don't have enough bytes to account for the nulls, save for later
			if (tBuf.length < bytesBuffer) {
				buffer = tBuf;
				return;
			}

			// throw away trailing nulls
			tBuf = tBuf.slice(bytesBuffer);
			totalRead += bytesBuffer;
		}

		// if we don't have enough to read the whole header, store it for later
		if (tBuf.length < recordSize) {
			buffer = tBuf;
			return;
		}

		doHeader(tBuf, function (err, data, rOffset) {
			if (err) {
				if (rOffset === 0) {
					return;
				}
				return cb(err);
			}

			header = data;

			// update total; rOffset should always be 512
			totalRead += rOffset;

			buffer = tBuf.slice(rOffset);
			if (buffer.length >= data.fileSize) {
				return readFile(cb);
			}
		});
	}

	/*
	 * Extract data from an input.
	 * 
	 * @param input- may be a ReadStream or a buffer
	 * @param opts- object of options
	 * @param cb- callback when everything is extracted
	 */
	function Untar (input, opts, cb) {
		if (typeof opts === 'function') {
			cb = opts;
			opts = {};
		}

		opts = opts || {};

		// if we're not given an EventEmitter, create one
		emitter = input instanceof events.EventEmitter ? input : new events.EventEmitter();

		emitter.on('data', function (data) {
			doFile(data, cb);
		});

		emitter.on('end', function () {
			doFile(cb);
		});

		// if input isn't an EventEmitter, emit data and end events
		if (input instanceof Buffer) {
			emitter.emit('data', input);
			emitter.emit('end');
		} else if (typeof input === 'string') {
			emitter.emit('data', new Buffer(input));
			emitter.emit('end');
		}
	}

	module.exports = Untar;
}());
