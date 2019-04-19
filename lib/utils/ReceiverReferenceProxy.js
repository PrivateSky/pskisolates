const PSKBuffer = require('PSKBuffer');

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
                        const result = originalReference.apply(targetObject, args);

                        return transform(result);
                    }
                }

                return propReference
            }
        }
    }

    function transform(arg) {
        if (Buffer.isBuffer(arg)) {
            const newBuffer = PSKBuffer.from(arg);

            return new ivm.ExternalCopy(newBuffer).copyInto();
        }

        return new ivm.ExternalCopy(arg).copyInto();
    }

};

module.exports = ReceiverReferenceProxy;
