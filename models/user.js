const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Schema for user
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username cannot be blank'],
  },
  password: {
    type: String,
    required: [true, 'Password cannot be blank'],
  },
});

// add function to userSchema: find user and validate w/ password
userSchema.statics.findAndValidate = async function (username, password) {
  const foundUser = await this.findOne({ username });
  const isValid = await bcrypt.compare(password, foundUser.password);
  return isValid ? foundUser : false;
};

// "this" refers to instance of User
// function is called before user.save() in /register route
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  // hash the pw
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

module.exports = mongoose.model('User', userSchema);
