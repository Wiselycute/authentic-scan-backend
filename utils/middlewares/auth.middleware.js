const User = require("../../src/models/User");
const { verify } = require("../libs/jwt");

//1.get token inside the request headers
const getToken = (req) => {
    const authorization = req.header('Authorization');
    if (authorization ) {
        const token = authorization.split(' ')[1];
        return token;
    }
    return null;
}

//2.verify the token
const isLogin = async (req, res, next) => {
    try {
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: "JWT secret is not configured" });
        }

        const token = getToken(req);
        if (!token) {
            return res.status(401).json({ message: "Unauthorized, token is missing !!!" });
        }
        const verifyToken = verify(token);
        if (!verifyToken) {
            return res.status(401).json({ message: "Unauthorized, token is invalid !!!" });
        }

//3.verify if valid, get the user id from the token and fetch the user from the database
         const id = verifyToken.id;
            const user = await User.findById(id).select('_id fullName email role');
         if (!user) {
            return res.status(401).json({ message: "Unauthorized, user not found !!!" });
         }

//4.attach the user to the request object and call next()
         req.user = user;
         next();

//5.if invalid, return an error response
    } catch (error) {
        return res.status(500).json({
             message: "Internal server error, please try again later !!!" });
    }
};



module.exports = { isLogin };