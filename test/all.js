#!/usr/bin/env node
(function () {
	'use strict';

	var fs = require('fs'),
		path = require('path'),
		forEachAsync = require('forEachAsync'),
		testDir = 'tests',
    testSetDir = 'test-sets',
    outDir = 'outs',
		fails = 0;

  function setup(cb) {
    if (path.existsSync(outDir)) {
      require('child_process').exec('rm -rf ' + outDir, function () {
        fs.mkdir(outDir, cb);
      });
    } else {
      fs.mkdir(outDir, cb);
    }
  }

  function runAll(cb) {
    var tests = fs.readdirSync(testDir).map(function (t) {
      return {
        fullPath: './' + path.join(testDir, t),
        name: t.replace(/\.js$/, '')
      };
    });

    console.log('Running tests:');
    forEachAsync(tests, function (next, t) {
      var outFullPath = path.join(outDir, t.name);

      fs.mkdirSync(outFullPath);

      console.log('  %s', t.name);

      require(t.fullPath)(function (err, out) {
        if (err) {
          fails++;
          console.error('  - Failed:', err);
        } else {
          console.error('  - Passed:', out || '');
        }

        next();
      }, path.resolve(__dirname, testSetDir), outFullPath);
    }).then(function () {
      if (fails >= 0) {
        console.error('%n/%n tests failed', fails, tests.length);
      } else {
        console.log('All tests passed!!');
      }
    });
  }

  function run(cb) {
    setup(function () {
      runAll(cb);
    });
  }

  if (require.main === module) {
    run(null);
  }

  module.exports = run;
}());
