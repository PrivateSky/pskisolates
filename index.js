const Isolate = require('./lib/Isolate');
const IsolateBuilder = require('./lib/IsolateBuilder');


function getDefaultIsolate(browserifyBundles, callback) {
    Isolate.initDefaultIsolate(browserifyBundles)
        .then(isolate => callback(undefined, isolate))
        .catch(callback);
}


module.exports = {
    getDefaultIsolate,
    IsolateBuilder
};
