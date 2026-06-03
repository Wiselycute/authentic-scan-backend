const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
    fullName: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 50,
        trim: true
    },
    email: {
        type: String,
        required: true,
        minlength: 4,
        maxlength: 100,
        unique: true,
        trim: true,
        lowercase: true,
        },
    password: { 
        type: String, 
        required: true, 
        minlength: 6,
        maxlength: 100,
        select: false,
    },   
    role : {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    }, {timestamps: true} 
    );
const User = mongoose.model("User", userSchema);
module.exports = User;
        
