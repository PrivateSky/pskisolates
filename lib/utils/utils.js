/**
 * Compares an object against a minimum or exact hierarchy of keys recursively ignoring values
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

    if(!allowExtraKeys && obj1Keys.length !== obj2Keys.length) {
        return false;
    }

    for(let i = 0; i < obj1Keys.length; ++i) {
        const key = obj1Keys[i];
        if(!obj.hasOwnProperty(key)) {
            return false;
        }

        if(typeof obj[key] === 'object') {
            if(!isIdenticalHierarchy(compareTarget[key], obj[key])) {
                return false;
            }
        }
    }

    return true;
}

module.exports = {
    isIdenticalHierarchy: isIdenticalHierarchy
};