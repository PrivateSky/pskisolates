const Isolate = require('./lib/DefaultConfiguredIsolate');
const IsolateBuilder = require('./lib/IsolateBuilder');
const IsolateConfig = require('./lib/IsolateConfig');


function getDefaultIsolate({shimsBundle, browserifyBundles, config}, callback) {
    Isolate.initDefaultIsolate({config, shimsBundle, browserifyBundles})
        .then(isolate => callback(undefined, isolate))
        .catch(callback);
}


module.exports = {
    getDefaultIsolate,
    IsolateBuilder,
    IsolateConfig
};
