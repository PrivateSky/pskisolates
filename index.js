const Isolate = require('./lib/DefaultConfiguredIsolate');
const IsolateBuilder = require('./lib/IsolateBuilder');
const IsolateConfig = require('./lib/IsolateConfig');
const utils = require('./lib/utils/utils');


function getDefaultIsolate({shimsBundle, browserifyBundles, config, externalApi}, callback) {
    const defaultIsolatePromise = Isolate.initDefaultIsolate({config, shimsBundle, browserifyBundles, externalApi});

    return utils.resolveWithCallbackIfAvailable(defaultIsolatePromise, callback);
}


module.exports = {
    getDefaultIsolate,
    IsolateBuilder,
    IsolateConfig
};
