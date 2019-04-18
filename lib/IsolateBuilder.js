const IsolatedExecutionEnv = require('./IsolatedExecutionEnvironment');

function IsolateBuilder(config) {
    const isolate = new IsolatedExecutionEnv(config);

    const operations = new Operations();

    return __prepareGlobalEnv();


    /************* BUILDER STEPS *************/

    function __prepareGlobalEnv() {
        return {
            prepareGlobalEnv: function (code) {
                operations.addStep(code, {delay: config.debug.delay, fileName: 'prepareGlobalEnv.js'});
                config.debug.delay = 0; // reset so only the first time the delay appears

                return __prepareRequire();
            }
        }
    }

    function __prepareRequire() {
        return {
            prepareRequire: function (code) {
                operations.addStep(code, {delay: config.debug.delay, fileName: 'prepareRequire.js'});

                return __insertBundles();
            }
        }
    }

    function __insertBundles() {
        return {
            insertBundles: function (code) {
                operations.addStep(code, {delay: config.debug.delay, fileName: 'insertBundles.js'});

                return __secureGlobalEnv();
            }
        }
    }

    function __secureGlobalEnv() {
        return {
            secureGlobalEnv: function (code) {
                operations.addStep(code, {delay: config.debug.delay, fileName: 'secureGlobalEnv.js'});

                return __build();
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