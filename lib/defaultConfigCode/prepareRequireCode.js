function createRequire(shimsBundle) {
    const code = `new function() {
        debugger;
        let ivm = _ivm;

        global.require = function (name) {
            let require = _require;
            
            console.log('created proxy for ', name);

            return global.ReferenceAccess.getAccessProxyFor(require.applySync(undefined, [name]));
        };
        
        global.externalApi.forEach((fnc, fncName)=>{
            global[fncName] = function (...args) {
              return global.ReferenceAccess.getAccessProxyFor(fnc.applySync(undefined, args));
            }
        });
        
        const bundle = ${shimsBundle}
        
        bundle('callflow');
        const se = bundle("swarm-engine");
        se.initialise();
    }; `;

    return code;
}

module.exports = createRequire;
