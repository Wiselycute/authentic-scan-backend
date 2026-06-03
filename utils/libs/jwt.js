const jsonwebtoken = require('jsonwebtoken');
const KEY = process.env.JWT_SECRET;

const sign = (data) => {
    if (!KEY) {
        throw new Error("JWT_SECRET is not set");
    }
    return jsonwebtoken.sign(data, KEY);
}
const verify =  (token) => {
    try {
    return jsonwebtoken.verify(token, KEY);
 } catch (error) {
    return null;
}
};
module.exports = {
    sign,
    verify
};