const Isolate = require('./lib/DefaultConfiguredIsolate');
const IsolateBuilder = require('./lib/IsolateBuilder');
const IsolateConfig = require('./lib/IsolateConfig');
const utils = require('./lib/utils/utils');


function getDefaultIsolate({shimsBundle, browserifyBundles, config}, callback) {
    const defaultIsolatePromise = Isolate.initDefaultIsolate({config, shimsBundle, browserifyBundles});

    return utils.resolveWithCallbackIfAvailable(defaultIsolatePromise, callback);
}


module.exports = {
    getDefaultIsolate,
    IsolateBuilder,
    IsolateConfig
};
