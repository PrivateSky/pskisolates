const ivm = require('isolated-vm/isolated-vm');
const utils = require('./utils/utils');
const defaultConfig = require('./IsolateConfig').defaultConfig;
let debuggerServer;
try {
    debuggerServer = require('./utils/debugger');
} catch (e) {
    // module 'ws' is not found, inspector capabilities are disabled
}

const ReceiverReferenceProxy = require('./utils/ReceiverReferenceProxy');


/**
 * Wrapper over ivm from isolate-vm module. It adds feature such as console, setTimeout and require inside the Isolate
 * @param {!Object} config - Instance of {IsolateConfig}
 * @constructor
 */
function IsolatedExecutionEnvironment(config) {
    /************* INITIALIZING OBJECT STATE *************/
    if (!utils.isIdenticalHierarchy(defaultConfig, config)) {
        throw new Error('Invalid config argument received');
    }

    const useInspector = config.debug.useInspector;

    const isolate = new ivm.Isolate({inspector: useInspector});
    const context = isolate.createContextSync({inspector: useInspector});
    const isolateGlobal = context.global;

    if (useInspector) {
        if(!debuggerServer) {
            console.error("Can't use debugger because module 'ws' is not installed");
            return;
        }
        
        debuggerServer.startDebugger(isolate, config.debug.debuggerPort);
    }

    /************* PREPARING ENVIRONMENT STATE *************/
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

    /************* PUBLIC METHODS *************/

    /**
     * Runs code inside current instance of Isolate
     * @param {!string} code - the code that will be run
     * @param {{fileName: string, delay: number}|function} runConfig - An instance of IsolateConfig or a function that will be used as callback
     * @param callback - If not present the function returns a Promise
     * @returns {Promise|undefined}
     */
    async function run(code, runConfig, callback) {
        if (typeof runConfig === 'function') {
            callback = runConfig;
            runConfig = undefined;
        }

        if (runConfig) {
            if (!utils.isIdenticalHierarchy(runConfig, {delay: '', fileName: ''})) {
                throw new Error('Tried to run with invalid config object');
            }
        } else {
            runConfig = {
                delay: config.runtime.delay,
                fileName: 'isolatedEnvironment.js'
            }
        }

        const resultPromise = __run(runConfig.delay, runConfig.fileName, code);

        return utils.resolveWithCallbackIfAvailable(resultPromise, callback);
    }


    /************* INTERNAL METHODS *************/

    async function __run(delay, fileName, code) {
        await _delay(delay);

        const prepareScript = await isolate.compileScript(code, {filename: fileName});
        return prepareScript.run(context);
    }


    /**
     * The obj will be be traversed recursively and each property will be transformed intro a {ivm.Reference}
     * @param obj
     * @param {ivm} ivm - Object returned by isolated-vm module
     * @param depth - If bigger than 0, the function will be called recursively until the depth is reach on all branches
     * @private
     */
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
            newObj = new ivm.Reference(ReceiverReferenceProxy.for(obj, ivm));
        }

        return newObj;
    }


    /**
     * Wrapper over setTimeout to be used with async/await
     * @param ms
     * @returns {Promise<any>}
     * @private
     */
    const _delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    /** EXPORTS **/

    this.run = run;
    this.rawIsolate = isolate;
}


module.exports = IsolatedExecutionEnvironment;
