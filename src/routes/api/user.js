const express = require('express');
const router = express.Router();

const UserModel = require('../../models/user');
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');

const { User } = UserModel;

router.get('/list', auth, role.checkRole(role.ROLES.Admin), async (req, res) => {
  const users = await User.find({})
  res.status(200).json({ users });
});

router.get('/', auth, async (req, res) => {
  const userId = req.user._id;

  let user;
  try {
    user = await User.findById(userId, { password: 0, _id: 0 });
  } catch(error) {
    return res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }

  res.status(200).json({ user });
});

router.put('/', auth, async (req, res) => {
  const userId = req.user._id;
  const update = req.body.profile;
  const query = { _id: userId };
  let user;
  try {
    user = await User.findOneAndUpdate(query, update, { new: true });
  } catch(error) {
    return res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Your profile is successfully updated!',
    user
  });
});

router.post('/password', auth, async (req, res) => {
  const email = req.user.email;
  const password = req.body.password;

  if (!password) {
    return res.status(400).json({ error: 'You must enter a password.' });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser === null) {
    return res.status(400).json({
      error: 'Your request could not be processed as entered. Please try again.'
    });
  }

  const salt = await bcrypt.genSalt(10)
  const hash = await bcrypt.hash(req.body.password, salt)

  req.body.password = hash;

  existingUser.password = req.body.password;

  await existingUser.save()
  await mailer.sendMail(existingUser.email, 'reset-confirmation');

  res.status(200).json({
    success: true,
    message: 'Password changed successfully. Please login with your new password.'
  });
});

module.exports = router;
