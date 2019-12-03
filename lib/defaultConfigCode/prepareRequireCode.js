function createRequire(shimsBundle) {
    const code = `new function() {
        debugger;
        let ivm = _ivm;

        global.require = function (name) {
            let require = _require;
            
            console.log('created proxy for ', name);

            return global.ReferenceAccess.getAccessProxyFor(require.applySync(undefined, [name]));
        };
        
        const bundle = ${shimsBundle}
        
        bundle('choreo');
    }; `;

    return code;
}

module.exports = createRequire;
