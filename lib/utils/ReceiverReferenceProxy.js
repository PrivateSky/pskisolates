const PSKBuffer = require('pskbuffer');

function ReceiverReferenceProxy(target) {}

/**
 * Converts values resulting from Node.js APIs (like Buffer) into transferable objects
 * @param target
 * @param ivm
 * @returns {*}
 */
ReceiverReferenceProxy.for = function (target, ivm) {
    if (!ivm) {
        throw new Error('Missing argument ivm');
    }

    return new Proxy(target, getHandler());

    /************* HELPERS *************/
    function getHandler() {
        return {
            get: function (targetObject, property) {
                let propReference = targetObject[property];

                if (typeof propReference === 'function') {
                    const originalReference = propReference;

                    propReference = function (...args) {

                        if (args[args.length - 1].typeof === 'function') { // probably a callback but this check may fail!
                            const callback = args[args.length - 1];

                            args[args.length - 1] = (...results) => {
                                callback.applySync(undefined, results.map(convertToTransferable));
                            }
                        }

                        const result = originalReference.apply(targetObject, args);

                        return convertToTransferable(result);
                    }
                }

                return propReference
            },
            ownKeys: function (target) {
                return Object.keys(target);
            }
        }
    }

    function convertToTransferable(arg) {
        if (Buffer.isBuffer(arg)) {
            const newBuffer = PSKBuffer.from(arg);

            return new ivm.ExternalCopy(newBuffer).copyInto();
        }

        if (isPrimitive(arg)) {
            return new ivm.ExternalCopy(arg).copyInto();
        }

        if (typeof arg === 'function') {
            return new ivm.Reference(arg);
        }

        if (typeof arg === 'object') {
            const newArg = JSON.parse(JSON.stringify(arg));
            return new ivm.ExternalCopy(newArg).copyInto();
        }

        return new ivm.ExternalCopy(arg).copyInto();
    }

    function isPrimitive(value) {
        return value !== Object(value);
    }

};

module.exports = ReceiverReferenceProxy;
