const IsolateConfig = require('./IsolateConfig');

const prepareEnvCode = require('./defaultConfigCode/prepareGlobalEnv');
const prepareRequireCode = require('./defaultConfigCode/prepareRequireCode');
const secureGlobalEnvCode = require('./defaultConfigCode/secureGlobalEnvCode');
const insertBundlesCode = require('./defaultConfigCode/insertBundlesCode');

const IsolateBuilder = require('./IsolateBuilder');

async function initDefaultIsolate({config, shimsBundle, browserifyBundles}) {

    if(!config) {
        config = IsolateConfig.defaultConfig;
    }

    if (!Array.isArray(browserifyBundles)) {
        if (browserifyBundles) {
            browserifyBundles = [browserifyBundles];
        } else {
            browserifyBundles = [];
        }

    }

    const isolateBuilder = new IsolateBuilder(config);

    return isolateBuilder
        .prepareGlobalEnv(prepareEnvCode)
        .prepareRequire(prepareRequireCode)
        .insertBundles(insertBundlesCode(bundles))
        .secureGlobalEnv(secureGlobalEnvCode)
        .build();
}

module.exports = {
    initDefaultIsolate
};
