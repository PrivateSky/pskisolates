const assert = require('assert');
const PSKBuffer = require('../../lib/utils/PSKBuffer');

function concatTest() {
    const x = PSKBuffer.from([1, 2, 3]);
    const y = PSKBuffer.from([4, 5, 6]);
    const z = PSKBuffer.from([7, 8, 9]);

    const concatenated = PSKBuffer.concat([x, y, z]);

    assert.strictEqual(concatenated.length, x.length + y.length + z.length, "Result doesn't match the expected length");

}

concatTest();
