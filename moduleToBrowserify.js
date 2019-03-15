const Addition = require('./anotherModuleToBrowserify');

const operations = {
    add: function(a, b) {
        return new Promise((res, rej) => {
            const add = new Addition();
            // const fs = require('path');
            // console.log(require('fs'));
            const timers = require('timers');
            timers.setTimeout(function() {
                res(add.addNumbers(a, b))
            });
        })

    }
};

module.exports = operations;
