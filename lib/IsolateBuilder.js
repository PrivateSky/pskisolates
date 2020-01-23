const IsolatedExecutionEnv = require('./IsolatedExecutionEnvironment');

function IsolateBuilder(config, externalApi) {
    const isolate = new IsolatedExecutionEnv(config);



    const operations = new Operations();

    return __prepareGlobalEnv();


    /************* BUILDER STEPS *************/

    function __prepareGlobalEnv() {
        return {
            prepareGlobalEnv: async function (code) {
                await isolate.run(code, {delay: config.debug.delay, fileName: 'prepareGlobalEnv.js'});
                config.debug.delay = 0; // reset so only the first time the delay appears

                return __prepareRequire();
            }
        }
    }

    function __prepareRequire() {
        return {
            insertExternalApi: async function(code) {
                await isolate.run(code, {delay: config.debug.delay, fileName: 'enableAccessToExternalApi.js'});

                if(typeof externalApi !== "undefined"){
                    const injectExternalAPIRef = isolate.context.global.getSync('injectExternalAPI');
                    Object.keys(externalApi).forEach((apiName)=>{
                        if(typeof externalApi[apiName] === "function"){
                            injectExternalAPIRef.applyIgnored(undefined, [apiName, new isolate.ivm.Reference(externalApi[apiName])])
                        }else{
                            console.log(`Found api ${apiName} that is not a function.`);
                        }
                    });
                }

                return this;
            },
            prepareRequire: async function (code) {
                await isolate.run(code, {delay: config.debug.delay, fileName: 'prepareRequire.js'});

                return __insertBundles();
            }
        }
    }

    function __insertBundles() {
        return {
            insertBundles: async function (code) {
                await isolate.run(code, {delay: config.debug.delay, fileName: 'insertBundles.js'});

                return __secureGlobalEnv();
            }
        }
    }

    function __secureGlobalEnv() {
        return {
            secureGlobalEnv: async function (code) {
                await isolate.run(code, {delay: config.debug.delay, fileName: 'secureGlobalEnv.js'});

                return isolate;
            }
        }
    }


    function __build() {
        return {
            build: async function () {
                const steps = operations.steps;
                
                for (const step of steps) { // forEach skips await and executes all simultaneously
                    await step();
                }

                return isolate;
            }
        }

    }


    /************* HELPER CLASS *************/
    function Operations() {
        const steps = [];

        return {
            addStep(code, config) {
                steps.push(async () => await isolate.run(code, config));
            },

            get steps() {
                return steps
            }
        };
    }
}


module.exports = IsolateBuilder;