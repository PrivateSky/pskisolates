const IsolatedEnv = require('./IsolatedExecutionEnvironment');
const IsolateConfig = require('./IsolateConfig');

const prepareEnvCode = require('./defaultPrepareEnvironmentCode');
const prepareRequireCode = require('./prepareRequireCode');
const secureGlobalEnvCode = require('./secureGlobalEnvCode');
const insertBundlesCode = require('./insertBundlesCode');
const IsolateBuilder = require('./isolateBuilder');

const fs = require('fs');

async function isolate(...browserifyBundles) {

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

const bundle = fs.readFileSync('./builds/devel/test.js', 'utf8');

isolate(bundle).then((is) => {
    is.run('');
    console.log('works');
})
.catch((err) => {
    console.log('err', err);
})