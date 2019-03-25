const IsolatedEnv = require('./IsolatedExecutionEnvironment');
const IsolateConfig = require('./IsolateConfig');

const prepareEnvCode = require('./defaultPrepareEnvironmentCode');
const prepareRequireCode = require('./prepareRequireCode');
const secureGlobalEnvCode = require('./secureGlobalEnvCode');

const fs = require('fs');

async function isolate() {

    const config = new IsolateConfig();
    const isolatedEnv = new IsolatedEnv(config);

    const bundle = fs.readFileSync('./pskruntime.js', 'utf8');



    await isolatedEnv.prepareGlobalEnv(prepareEnvCode);

    const req = prepareRequireCode(bundle);
    // console.log(req);
    await isolatedEnv.prepareRequire(req);
    await isolatedEnv.secureGlobalEnv(secureGlobalEnvCode);
}


isolate().then(() => {
    console.log('works');
})
.catch((err) => {
    console.log('err', err);
})