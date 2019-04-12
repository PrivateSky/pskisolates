const Isolate = require('..');
const fs = require('fs');

const defaultBundle = fs.readFileSync('../lib/shimsGenerator/builds/devel/sandboxBase.js', 'utf8');

const config = Isolate.IsolateConfig.defaultConfig;
config.debug.useInspector = true;
config.runtime.delay = 10;

Isolate.getDefaultIsolate({shimsBundle: defaultBundle, config}, async (err, defaultIsolate) => {
    if(err) {
        throw err;
    }

    await defaultIsolate.run(`
        debugger;
        // const buffer = require('url');
        // console.log('uite buffer', buffer.parse('http://google.com'));
        // console.log('sunt in isolate');
        
        // const stream = require('stream');
        // console.log(global);
        const crypto = require('crypto');
        
        const bytes = crypto.randomBytes(10);
        
        console.log('hopa crypto', bytes.copySync());
    `);
    console.log('Init successful');
});