function createRequire (browserifyBundle) {
    const code = `new function() {
        debugger;
        let ivm = _ivm;

        global.Module = {};
        global.Module.prototype = global.Module.__proto__ = {};
        
        
        // new Function(${syntaxHelper()})();
        
        global.Module.prototype.require = global.require = function(name) {
            let require = _require;
            
            console.log('trying to load module', name);
            
            return require.applySync(undefined, [name]);
        }
        
        const bundle = ${browserifyBundle};
    }; `;

    return code;
}

const syntaxHelper = function() {} /*function () {
    return 'new ' + function () {
        let require = _require;

        let path = require('path');

        require.applySync(undefined, [name]);
    };
};*/

module.exports = createRequire;

