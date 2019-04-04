function createBundles(...bundles) {

    let code = 'debugger;\n';

    bundles.forEach(bundle => {
       code += bundle + '\n';
    });

    console.log('code ', code.length);

    return code;
}

module.exports = createBundles;