function IsolateConfig() {
    return {
        debug: {
            useInspector: false,
            debuggerPort: 10000,
            delay: 0 // used to postpone execution to have time to connect to debugger server
        },
        runtime: {
            delay: 0
        },
        logger: {send: console.log}
    }
}


module.exports = {
    get defaultConfig() {
        return new IsolateConfig();
    }
};
