/**
 * @deprecated Use isIdenticalKeysHierarchy instead. It was tested and this variant is 10x slower
 * @param first {Object}
 * @param second {Object}
 * @returns {boolean}
 */
function hasIdenticalObjectKeysHierarchy(first, second) {
    if (typeof first !== 'object' || typeof second !== 'object') {
        return false;
    }

    const firstTransformed = generateObjectKeysHierarchy(first);
    const secondTransformed = generateObjectKeysHierarchy(second);

    if (firstTransformed.length !== secondTransformed.length) {
        return false;
    }

    const secondAsMap = arrayToObject(secondTransformed);
    
    for (const hierarchy of firstTransformed) {
        if (secondAsMap[hierarchy] !== true) {
            return false;
        }
    }

    return true;
}

function arrayToObject(arr) {
    return arr.reduce((map, value) => {
        map[value] = true;
        return map;
    }, {});
}

function flattenArray(arr) {
    return arr.reduce((acc, val) => Array.isArray(val) ? acc.concat(flattenArray(val)) : acc.concat(val), []);
}

function generateObjectKeysHierarchy(obj, currentPropertyName = '') {
    if (typeof obj !== 'object' || Array.isArray(obj) || Buffer.isBuffer(obj)) {
        return [currentPropertyName];
    }

    let hierarchies = [];

    Object.keys(obj)
        .forEach(key => {
            const hierarchy = generateObjectKeysHierarchy(obj[key], key);
            const concatHierarchy = hierarchy.map(name => currentPropertyName + '/' + name);

            hierarchies.push(concatHierarchy);
        });


    return flattenArray(hierarchies)
}

function isIdenticalKeysHierarchy(obj1, obj2) {
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
            if(!isIdenticalKeysHierarchy(obj1[key], obj2[key])) {
                return false;
            }
        }
    }

    return true;
}

module.exports = {
    isIdenticalKeysHierarchy
};