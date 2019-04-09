function createRequire(shimsBundle) {
    const code = `new function() {
        debugger;
        let ivm = _ivm;
        
        global.require = function(name) {
            let require = _require;

            return global.ReferenceAccess.getAccessProxyFor(require.applySync(undefined, [name]));
        };
        
        
        const bundle = ${shimsBundle}
        
        bundle('requriedBuiltIns');
        
        // const buffer = require('buffer');
        // const b = buffer.Buffer;
        //
        // const x = b.from([70, 71]);
        //
        // console.log(x.toString());
        //
        // const url = require('url');
        //
        // const parsed = url.parse('http://127.0.0.1:8080');
        //
        // console.log('a mers cumva');
    }; `;

    return code;
}

const code = 'new ' + function () {
    debugger;
    let ivm = _ivm;

    global.require = function (name) {
        let require = _require;

        return global.ReferenceAccess.getAccessProxyFor(require.applySync(undefined, [name]));
    };
};


module.exports = code;

