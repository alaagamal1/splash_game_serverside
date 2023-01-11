//CHAT MESSAGES DATABASE SCHEMA

const db = require('mongoose');

const msgsSchema = new db.Schema({
    name: String,
    message: {
        type: String,
        required: true
    },
    messageTime: {
        type: Date,
        required: true,
        default: Date.now
    }
})

module.exports = db.model('Messages', msgsSchema)