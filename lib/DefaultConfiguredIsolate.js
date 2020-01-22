const IsolateConfig = require('./IsolateConfig');

const prepareEnvCode = require('./defaultConfigCode/prepareGlobalEnv');
const prepareRequireCode = require('./defaultConfigCode/prepareRequireCode');
const secureGlobalEnvCode = require('./defaultConfigCode/secureGlobalEnvCode');
const insertBundlesCode = require('./defaultConfigCode/insertBundlesCode');
const enableAccessToExternalApiCode = require('./defaultConfigCode/enableAccessToExternalApi');

const IsolateBuilder = require('./IsolateBuilder');

// TODO: Add PSKBuffer dynamically inside isolate

/**
 *
 * @param {?Object} config - instance of {IsolateConfig}
 * @param {?string} shimsBundle - A browserify bundle containing the minimum libraries that are needed to instantiate environment
 * @param {?string} browserifyBundles - A browserify bundle with libraries/modules accessible after initialization
 * @returns {Promise<IsolatedExecutionEnvironment>} - Isolate with environment ready for normal execution
 */
async function initDefaultIsolate({config, shimsBundle, browserifyBundles, externalApi}) {

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

    const isolateBuilder = new IsolateBuilder(config, externalApi);

    return await isolateBuilder
        .prepareGlobalEnv(prepareEnvCode)
        .insertExternalApi(enableAccessToExternalApiCode())
        .prepareRequire(prepareRequireCode(shimsBundle))
        .insertBundles(insertBundlesCode(browserifyBundles))
        .secureGlobalEnv(secureGlobalEnvCode);
}

module.exports = {
    initDefaultIsolate
};
