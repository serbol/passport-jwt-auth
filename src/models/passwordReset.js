const Mongoose = require('mongoose');

const { Schema } = Mongoose;

const PasswordResetSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  passwordResetId: {
    type: String,
    required: true,
    index: {
      expires: 60 * 60
    }
  },
});

module.exports = Mongoose.model('PasswordReset', PasswordResetSchema);
