'use strict';

var fs = require('fs');

function walk(path, targets, outPut) {  
    var dirList = fs.readdirSync(path);

    dirList.forEach(function(item){
        if(fs.statSync(path + '/' + item).isDirectory()){
            walk(path + '/' + item, targets, outPut);
        } else if (targets.indexOf(item) !=  -1) {
        	var cachedFiles = outPut[path];
        	if (cachedFiles == undefined) { cachedFiles = {} };
        	cachedFiles[item] = path + '/' + item;
        	outPut[path] = cachedFiles;
        }
    });
    return outPut;
}

module.exports = {
	collectTargets: function(fromPath, targets) {
		return walk(fromPath, targets, {});
	}
};
