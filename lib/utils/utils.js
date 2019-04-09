/**
 * Compares equality of the hierarchy of keys of two objects recursively ignoring their values
 * @param obj1
 * @param obj2
 * @returns {boolean}
 */
function isIdenticalHierarchy(obj1, obj2) {
    if (typeof obj1 !== 'object' || typeof obj1 !== 'object') {
        return false;
    }

    const obj1Keys = Object.keys(obj1);
    const obj2Keys = Object.keys(obj2);

    if(obj1Keys.length !== obj2Keys.length) {
        return false;
    }

    for(let i = 0; i < obj1Keys.length; ++i) {
        const key = obj1Keys[i];
        if(!obj2.hasOwnProperty(key)) {
            return false;
        }

        if(typeof obj2[key] === 'object') {
            if(!isIdenticalHierarchy(obj1[key], obj2[key])) {
                return false;
            }
        }
    }

    return true;
}

module.exports = {
    isIdenticalHierarchy: isIdenticalHierarchy
};