const bcrypt = require('bcrypt');

const hash = async (password) => {
    if (password.length === 0) throw new Error("Password is required !!!");
    return await bcrypt.hash(password, 10);
};

const compare = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

module.exports = { hash, compare };