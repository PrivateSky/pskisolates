function Addition () {
    this.addNumbers = function(...numbers) {
        return numbers.reduce((total, num) => total + num);
    }
}

module.exports = Addition;