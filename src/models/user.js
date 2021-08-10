const Mongoose = require('mongoose');

const { Schema } = Mongoose;

const UserSchema = new Schema({
  email: {
    type: String,
    required: () => this.provider === 'email'
  },
  firstName: {
    type: String
  },
  lastName: {
    type: String
  },
  password: {
    type: String
  },
  provider: {
    type: String,
    default: 'email'
  },
  googleId: {
    type: String
  },
  facebookId: {
    type: String
  },
  avatar: {
    type: String
  },
  role: {
    type: String,
    enum: ['ROLE_MEMBER', 'ROLE_ADMIN'],
    default: 'ROLE_MEMBER'
  },
  updated: {
    type: Date
  },
  created: {
    type: Date,
    default: Date.now,
  },
});

const TemporaryUserSchema = UserSchema.clone();

TemporaryUserSchema.add({
  activationId: {
    type: String
  },
})

TemporaryUserSchema.path('created').index({ expires: 60 * 60 });

exports.User = Mongoose.model('User', UserSchema);
exports.TemporaryUser = Mongoose.model('TemporaryUser', TemporaryUserSchema)
