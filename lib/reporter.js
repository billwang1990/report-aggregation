'use strict';

var jsonFile = require('jsonfile');
var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var collector = require('./collectData');

var parseJSONReport = function(report) {
    var featureOutput = jsonFile.readFileSync(report);
    featureOutput.summary = {
        isFailed: false,
        passed: 0,
        failed: 0,
        time: 0
    };

    var result = {
        status: {
            passed: 'passed',
            failed: 'failed',
            skipped: 'skipped',
            pending: 'pending',
            undefined: 'undefined'
        }
    };

    var featuresSummary = featureOutput.summary;

    featureOutput.forEach(function(feature) {
            feature.scenarios = {};
            feature.scenarios.passed = 0;
            feature.scenarios.failed = 0;
            feature.scenarios.notdefined = 0;
            feature.scenarios.skipped = 0;
            feature.scenarios.pending = 0;
            feature.time = 0;
            featuresSummary.isFailed = false;

            if (!feature.elements) {
                return;
            }

            feature.elements.forEach(function(element) {
                element.passed = 0;
                element.failed = 0;
                element.notdefined = 0;
                element.skipped = 0;
                element.pending = 0;
                element.time = 0;

                element.steps.forEach(function(step) {

                    if (!step.result) {
                        return 0;
                    }
                    if (step.result.duration) {
                        element.time += step.result.duration;
                    }
                    if (step.result.status === result.status.passed) {
                        return element.passed++;
                    }
                    if (step.result.status === result.status.failed) {
                        return element.failed++;
                    }
                    if (step.result.status === result.status.undefined) {
                        return element.notdefined++;
                    }
                    if (step.result.status === result.status.pending) {
                        return element.pending++;
                    }

                    element.skipped++;
                });

                if (element.time > 0) {
                    feature.time += element.time;
                }

                if (element.notdefined > 0) {
                    feature.scenarios.notdefined++;
                    return ;
                }

                if (element.failed > 0) {
                    feature.scenarios.failed++;
                    featuresSummary.isFailed = true;
                    return ;
                }

                if (element.skipped > 0) {
                    feature.scenarios.skipped++;
                    return ;
                }

                if (element.pending > 0) {
                    feature.scenarios.pending++;
                    return ;
                }

                if (element.passed > 0) {
                    feature.scenarios.passed++;
                    return ;
                }
            });

            featuresSummary.time += feature.time;
            if (featuresSummary.isFailed) {
                featuresSummary.failed++;
            } else {
                featuresSummary.passed++;
            }

        });

    return featuresSummary;
}

function readFile(fileName) {
    function getPath(name) {
        //use custom template based on user's requirement
        return path.join(__dirname, '..', 'templates', 'bootstrap', name);
    }

    return fs.readFileSync(getPath(fileName), 'utf-8');
}


var calculateDuration = function(duration) {
    var oneNanoSecond = 1000000000;
    var oneMinute = 60 * oneNanoSecond;
    duration = parseInt(duration);

    function format(min, sec) {
        sec =  sec + 's';
        return min > 0 ? min + 'm ' + sec : sec;
    }

    if (!isNaN(duration)) {
        var min = _.floor(duration / oneMinute);
        var sec = _.round((duration % oneMinute) / oneNanoSecond);
        return format(min, sec);
    }
};

function generateAggregation(searchPath) {
    // body...
    function parseCollectedFiles(files) {
        var JsonContent = []

        for (var key in files) {
            var item = files[key];

            if ((item["deviceInfo"] != undefined) && (item["functionals.json"] != undefined) && (item["functionals.html"] != undefined) ) {
                // parse device info
                var deviceInfo = jsonFile.readFileSync(item["deviceInfo"]);

                var report = parseJSONReport(item["functionals.json"]);
                report["device"] = deviceInfo["device"];
                report["system"] = deviceInfo["system"];
                report["orig_report"] = deviceInfo["functionals.json"];
                report["time"] = calculateDuration(report.time);
                report["totalScenarios"] = report.failed + report.passed;
                report["successRate"] = Math.floor((report.passed / report.failed + report.passed) * 100);
                report["origReportPath"] = item["functionals.html"];
                JsonContent.push(report);
            } 
        }

        return JsonContent;
    }

    function generateHtmlReport(json) {
        // body...
        fs.writeFileSync(
            './iOS_functional_report.html',
            _.template(readFile('index.tmpl'))({
                reports: json,
                styles: readFile('style.css')
            })
        );
 
    }
    var collectedFiles = collector.collectTargets(searchPath, ["functionals.html", "deviceInfo", "functionals.json"], {});
    // console.log(collectedFiles);
    var json = parseCollectedFiles(collectedFiles);
    generateHtmlReport(json);
}


module.exports = {
    generate: generateAggregation
};
