let ivm = require('isolated-vm');
const utils = require('./utils/utils');
const defaultConfig = require('./IsolateConfig')();
const debuggerServer = require('./debugger');

function IsolatedExecutionEnvironment(config) {
    /** INITIALIZING OBJECT STATE **/
    if (!utils.isIdenticalKeysHierarchy(config, defaultConfig)) {
        throw new Error('Invalid config argument received');
    }

    const useInspector = config.debug.useInspector;

    const isolate = new ivm.Isolate({inspector: useInspector});
    const context = isolate.createContextSync({inspector: useInspector});
    const isolateGlobal = context.global;

    if (useInspector) {
        debuggerServer.startDebugger(isolate, config.debug.debuggerPort);
    }

    /** PREPARING ENVIRONMENT STATE **/
    isolateGlobal.setSync('global', isolateGlobal.derefInto());
    isolateGlobal.setSync('_ivm', ivm);
    isolateGlobal.setSync('_console', _deepReference(console, ivm));
    isolateGlobal.setSync('_setTimeout', new ivm.Reference(function (timeout, callbackRef) {
        setTimeout(function () {
            callbackRef.applyIgnored(undefined, []);
        }, timeout);
    }));
    isolateGlobal.setSync('_require', new ivm.Reference(function (name) {
        return _deepReference(require(name), ivm);
    }));


    /** PUBLIC METHODS **/
    async function prepareGlobalEnv(code) {
        await delay(config.debug.delay);

        const prepareScript = await isolate.compileScript(code, {filename: 'prepareEnvironment.js'});
        await prepareScript.run(context);

        return this;
    }


    async function prepareRequire(code) {
        await delay(config.debug.delay);

        const prepareScript = await isolate.compileScript(code, {filename: 'prepareRequire.js'});
        await prepareScript.run(context);

        return this;
    }

    async function secureGlobalEnv(code) {
        await delay(config.debug.delay);

        const prepareScript = await isolate.compileScript(code, {filename: 'secureEnvironment.js'});
        await prepareScript.run(context);

        return this;
    }

    async function run(code) {
        await delay(config.runtime.delay);

        const prepareScript = await isolate.compileScript(code, {filename: 'isolateRuntime.js'});
        await prepareScript.run(context);
    }

    /** INTERNAL METHODS **/


    function _deepReference(obj, ivm, depth = 0) {
        let newObj = {};

        if (!ivm) {
            throw new Error('Missing argument ivm');
        }

        if (depth > 0) {
            Object.keys(obj).forEach(key => {
                // might not be good enough
                if (typeof obj[key] === 'object' && !Buffer.isBuffer(key)) {
                    newObj[key] = _deepReference(obj[key], ivm, depth - 1);
                }
            });
        } else {
            newObj = new ivm.Reference(obj);
        }

        return newObj;
    }

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    /** EXPORTS **/

    this.prepareGlobalEnv = prepareGlobalEnv;
    this.prepareRequire = prepareRequire;
    this.secureGlobalEnv = secureGlobalEnv;
}


module.exports = IsolatedExecutionEnvironment;