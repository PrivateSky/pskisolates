const IsolateConfig = require('./IsolateConfig');

const prepareEnvCode = require('./defaultConfigCode/defaultPrepareEnvironmentCode');
const prepareRequireCode = require('./defaultConfigCode/prepareRequireCode');
const secureGlobalEnvCode = require('./defaultConfigCode/secureGlobalEnvCode');
const insertBundlesCode = require('./defaultConfigCode/insertBundlesCode');

const IsolateBuilder = require('./IsolateBuilder');

async function initDefaultIsolate({config, bundles}) {

    if(!config) {
        config = IsolateConfig.defaultConfig;
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
