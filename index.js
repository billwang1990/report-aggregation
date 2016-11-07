#!/usr/bin/env node

'use strict';

var reporter = require('./lib/reporter');
var program = require('commander');

program.option("-p, --path <string>", "specify the search path, default is current path ")
	.parse(process.argv);

var path = program.path || ".";

reporter.generate(path);

