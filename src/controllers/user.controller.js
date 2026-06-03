const userService = require('../services/user.service');
const User = require('../models/User');
const { hash, compare } = require('../../utils/libs/bcrypt.lib');
const { sign } = require('../../utils/libs/jwt');

const sanitizeUser = (user) => {
    if (!user) {
        return user;
    }

    const plain = typeof user.toObject === 'function' ? user.toObject() : { ...user };
    delete plain.password;
    return plain;
};

const create = async (req, res) => {
    try {
        const payload = { ...req.body };
        if (payload.confirm_password) {
            delete payload.confirm_password;
        }

        if (payload.email) {
            payload.email = payload.email.toLowerCase();
        }

        const existing = await User.findOne({ email: payload.email });
        if (existing) {
            return res.status(400).json({
                message: 'Email already exists'
            });
        }

        payload.password = await hash(payload.password);

        const result = await userService.create(payload);
        if (result.error) {
            return res.status(400).json({
                message: result.message
            });
        }

        const token = sign({ id: result.data._id, role: result.data.role, email: result.data.email });
        return res.status(201).json({
            message: 'User Created Successfully!!!',
            data: { token }
        });
    } catch (error) {
        console.error('Error: ', error);
        return res.status(500).json({
            message: 'Internal Server Error, please retry later !!!'
        });
    }
}

const findMany = async (req, res) => {
    const result = await userService.findBy(req.query);
    if (result.error) {
        return res.status(400).json({
            message: result.message
        });
    }

    return res.status(200).json({
        message: 'Users fetched successfully!!!',
        data: Array.isArray(result.data) ? result.data.map(sanitizeUser) : [],
    });
}

const find = async (req, res) => {
     const result = await userService.findBy(req.params.id);
    if (result.error) {
        return res.status(400).json({
            message: result.message
        });
    }

    return res.status(200).json({
        message: 'User fetched successfully!!!',
        data: sanitizeUser(result.data),
    });
}

const update = async (req, res) => {
    const payload = { ...req.body };
    if (payload.password) {
        payload.password = await hash(payload.password);
    }

     const result = await userService.update(req.params.id, payload);
    if (result.error) {
        return res.status(400).json({
            message: result.message
        });
    }

    return res.status(201).json({
        message: 'User updated successfully!!!'
    });
}

const remove = async (req, res) => {
     const result = await userService.remove(req.params.id);
    if (result.error) {
        return res.status(400).json({
            message: result.message
        });
    }

    return res.status(201).json({
        message: 'User deleted successfully!!!'
    });
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() }).select('_id password role email');
        if (!user) {
            return res.status(400).json({
                message: 'Invalid credentials !!!'
            });
        }

        const isMatch = await compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                message: 'Invalid credentials !!!'
            });
        }

        const token = sign({ id: user._id, role: user.role, email: user.email });
        return res.status(200).json({
            message: 'User login successfully !!!',
            data: { token, role: user.role }
        });
    } catch (error) {
        console.error('Error: ', error);
        return res.status(500).json({
            message: 'Internal Server Error, please retry later !!!'
        });
    }
}

const getProfile = async (req, res) => {
    const result = await userService.findBy(req.user._id);
    if (result.error) {
        return res.status(400).json({ message: result.message });
    }
    return res.status(200).json({ data: sanitizeUser(result.data) });
};

// Verify authentication token
const verifyAuth = async (req, res) => {
    // If we reach here, the authMiddleware already verified the token
    // req.user contains the decoded token data
    return res.status(200).json({ 
        message: 'Token is valid',
        data: req.user
    });
};

module.exports = {
    create,
    login,
    findMany,
    find,
    update,
    remove,
    getProfile,
    verifyAuth

}