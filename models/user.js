//USERS DATABASE SCHEMA

const db = require('mongoose');

const userSchema = new db.Schema({
    username: String,
    password: String,
    passedCars: {
        type: Number,
        default: 0
    }
})

module.exports = db.model('Users', userSchema)