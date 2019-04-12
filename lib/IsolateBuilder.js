const IsolatedExecutionEnv = require('./IsolatedExecutionEnvironment');

function IsolateBuilder(config) {
    const isolate = new IsolatedExecutionEnv(config);

    const operations = new Operations();

    return __prepareGlobalEnv(operations);


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
                const ops = operations.getOperations();

                for (let i = 0; i < ops.length; ++i) {
                    await ops[i]();
                }

                return isolate;
            }
        }

    }


    /************* HELPER CLASS *************/
    function Operations() {
        const ops = [];

        this.addStep = function (code, config) {
            ops.push(async function () {
                await isolate.run(code, config);
            });
        };

        this.getOperations = () => ops;
    }
}


module.exports = IsolateBuilder;