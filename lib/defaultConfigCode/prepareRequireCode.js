function createRequire(shimsBundle) {
    const code = `new function() {
        debugger;
        let ivm = _ivm;
              
        const bundle = ${shimsBundle}
        
        bundle('callflow');
        const se = bundle("swarm-engine");
        se.initialise();
    }; `;

    return code;
}

module.exports = createRequire;
