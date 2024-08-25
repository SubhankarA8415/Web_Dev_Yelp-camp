const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    }
})
UserSchema.plugin(passportLocalMongoose);
// this plugin will automatically add username and password and also ensures username to be unique
module.exports = mongoose.model('User', UserSchema);