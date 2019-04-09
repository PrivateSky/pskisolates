function createBundles(...bundles) {

    let code = 'debugger;\n';

    bundles.forEach(bundle => {
       code += bundle + '\n';
    });

    return code;
}

module.exports = createBundles;