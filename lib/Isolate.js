const IsolateConfig = require('./IsolateConfig');

const prepareEnvCode = require('./defaultConfigCode/defaultPrepareEnvironmentCode');
const prepareRequireCode = require('./defaultConfigCode/prepareRequireCode');
const secureGlobalEnvCode = require('./defaultConfigCode/secureGlobalEnvCode');
const insertBundlesCode = require('./defaultConfigCode/insertBundlesCode');

const IsolateBuilder = require('./IsolateBuilder');

const fs = require('fs');

async function initDefaultIsolate(...browserifyBundles) {

    const config = IsolateConfig.defaultConfig;
    config.debug.useInspector = true;
    config.debug.delay = 3000;

    const isolateBuilder = new IsolateBuilder(config);

    return isolateBuilder
        .prepareGlobalEnv(prepareEnvCode)
        .prepareRequire(prepareRequireCode)
        .insertBundles(insertBundlesCode(browserifyBundles))
        .secureGlobalEnv(secureGlobalEnvCode)
        .build();
}

module.exports = {
    initDefaultIsolate
};
