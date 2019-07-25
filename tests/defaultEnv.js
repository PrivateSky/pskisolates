const Isolate = require('..');
const fs = require('fs');

const defaultBundle = fs.readFileSync('../../../builds/devel/sandboxBase.js', 'utf8');

const config = Isolate.IsolateConfig.defaultConfig;
config.debug.useInspector = false;
config.runtime.delay = 0;

Isolate.getDefaultIsolate({shimsBundle: defaultBundle, config}, async (err, defaultIsolate) => {
    if (err) {
        throw err;
    }

    await defaultIsolate.run(`
        debugger;
        const crypto = require('crypto');
        
        const bytes = crypto.randomBytes(10);
        console.log('bytes', bytes);
    `);

    console.log('Run successful');
});
