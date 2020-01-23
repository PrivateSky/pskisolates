/**
 * Compares an object against a minimum or exact hierarchy of keys recursively ignoring values
 * Important note: The order of the parameters (compareTarget, obj) matters!
 * @param compareTarget{Object} - The `obj` parameter will be compared against this one
 * @param obj {Object}
 * @param allowExtraKeys {boolean} - If true, `obj` can have more keys than `compareTarget`
 * @returns {boolean}
 */
function isIdenticalHierarchy(compareTarget, obj, allowExtraKeys = true) {
    if (typeof compareTarget !== 'object' || typeof compareTarget !== 'object') {
        return false;
    }

    const obj1Keys = Object.keys(compareTarget);
    const obj2Keys = Object.keys(obj);

    if (!allowExtraKeys && obj1Keys.length !== obj2Keys.length) {
        return false;
    }

    for (let i = 0; i < obj1Keys.length; ++i) {
        const key = obj1Keys[i];
        if (!obj.hasOwnProperty(key)) {
            return false;
        }

        if (typeof obj[key] === 'object') {
            if (!isIdenticalHierarchy(compareTarget[key], obj[key])) {
                return false;
            }
        }
    }

    return true;
}

/**
 * Converts a promise to a callback
 * @param {!Promise} promise
 * @param {!function} callback
 */
function wrapPromiseInCallback(promise, callback) {
    promise
        .then((...result) => callback(undefined, ...result))
        .catch(callback);
}

/**
 * If callback is present then resolves promise and passes result to callback, otherwise just returns the promise
 * It is useful when a function can "return" with a callback if present otherwise just returning a promise, this
 * tries to standardize the process
 * @param {!Promise} promise
 * @param {?function} callback
 * @returns {Promise|undefined}
 */
function resolveWithCallbackIfAvailable(promise, callback) {
    if (callback && typeof callback === 'function') {
        wrapPromiseInCallback(promise, callback);
    } else {
        return promise;
    }
}

/**
 * The obj will be be traversed recursively and each property will be transformed intro a {ivm.Reference}
 * @param obj
 * @param {ivm} ivm - Object returned by isolated-vm module
 * @param depth - If bigger than 0, the function will be called recursively until the depth is reach on all branches
 * @private
 */
function createDeepReference(obj, depth = 0) {
    const isolatedVMName = 'isolated-vm';
    const ivm = require(isolatedVMName);
    const ReceiverReferenceProxy = require('./ReceiverReferenceProxy');
    let newObj = {};

    if (!ivm) {
        throw new Error('Missing argument ivm');
    }

    if (depth > 0) {
        Object.keys(obj).forEach(key => {
            // might not be good enough
            if (typeof obj[key] === 'object' && !Buffer.isBuffer(key)) {
                newObj[key] = createDeepReference(obj[key], ivm, depth - 1);
            }
        });
    } else {
        newObj = new ivm.Reference(ReceiverReferenceProxy.for(obj, ivm));
    }

    return newObj;
}

module.exports = {
    isIdenticalHierarchy: isIdenticalHierarchy,
    resolveWithCallbackIfAvailable,
    wrapPromiseInCallback,
    createDeepReference
};