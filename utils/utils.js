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

module.exports = {
    hasIdenticalObjectKeysHierarchy
};