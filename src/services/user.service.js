const BaseService = require('./base.service');
const User = require('../models/User');

class UserService extends BaseService {
    constructor() {
        super(User); 
    };
}

const userService = new UserService();
module.exports = userService;


// const create = async (data) => {
//     try {
//         const result = await User.create(data);
//         return {error: false, data:result}

//     } catch (error) {
//         return {
//             error: true,
//             message: error.message || 'Internal Server Error, Please try again later.'
//         };
//     }
// };

// const findBy = async (filter) => {
//     try {
//         const where = typeof filter === 'string' ? {'_id': filter} : filter;

//         const result = await User.findOne(where);
//         return {error: false, data: result}

//     } catch (error) {
//         return {
//             error: true,
//             message: error.message || 'Internal Server Error, Please try again later.'
//         }
//     }

// };

// const update = async (id, data) => {
//     try {
//         const result = await User.findByIdAndUpdate(id, data);
//         return {error: false, data: result}

//     } catch (error) {
//         return {
//             error: true,
//             message: error.message || 'Internal Server Error, Please try again later.'
//         }
//     }
// };

// const remove = async (id) => {
//     try {
//         const result = await User.findByIdAndDelete(id);
//         return {error: false, data: result}
            
//     } catch (error) {
//         return {
//             error: true,
//             message: error.message || 'Internal Server Error, Please try again later.'
//         };
//     }
// };

// module.exports = {
//     create,
//     findBy,
//     update,
//     remove,
// };