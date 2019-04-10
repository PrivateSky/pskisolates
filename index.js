const Isolate = require('./lib/Isolate');
const IsolateBuilder = require('./lib/IsolateBuilder');
const IsolateConfig = require('./lib/IsolateConfig');


function getDefaultIsolate(browserifyBundles, config, callback) {
    if(typeof config === 'function') {
        callback = config;
        config = IsolateConfig.defaultConfig;
    }

    Isolate.initDefaultIsolate({config, bundles: browserifyBundles})
        .then(isolate => callback(undefined, isolate))
        .catch(callback);
}


module.exports = {
    getDefaultIsolate,
    IsolateBuilder,
    IsolateConfig
};
