const mongoose = require('mongoose');
const DATABASE_URL = process.env.MONGO_URI || "mongodb://localhost:27017/betting";

const connect = async () => {
    try {
    await mongoose.connect(DATABASE_URL);
    return true;
    } catch (error) {
    console.error("database connection error", error);
       return false;
    }
};

module.exports = { connect };