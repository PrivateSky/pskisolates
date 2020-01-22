function createRequire() {
    const code = `new function() {
        global.injectExternalAPI = function(fncName, fnRef) {
            global[fncName] = function (...args) {
              return global.ReferenceAccess.getAccessProxyFor(fnRef.applySync(undefined, args));
            }
        }
    }; `;

    return code;
}

module.exports = createRequire;