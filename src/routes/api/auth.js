const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const passport = require('passport');

const UserModel = require('../../models/user');
const PasswordReset = require('../../models/passwordReset');
const mailer = require('../../services/mailer');
const limiter = require('../../middleware/limiter');
const keys = require('../../config/keys');

const { secret, tokenLife } = keys.jwt;
const { User, TemporaryUser } = UserModel;

router.post('/login', limiter(), async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email) {
    return res.status(400).json({ error: 'You must enter an email address.' });
  }

  if (!password) {
    return res.status(400).json({ error: 'You must enter a password.' });
  }

  const user = await User.findOne({ email })
  if (!user || !user.password) {
    return res
      .status(400)
      .send({ error: 'No user found for this email address.' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      error: 'Incorrect password.'
    });
  }

  const payload = {
    id: user.id
  };

  jwt.sign(payload, secret, { expiresIn: tokenLife }, (error, token) => {
    res.status(200).json({
      success: true,
      token: `Bearer ${token}`,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  });
});

router.post('/register', limiter(), async (req, res) => {
  const email = req.body.email;
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const password = req.body.password;

  if (!email) {
    return res.status(400).json({ error: 'You must enter an email address.' });
  }

  if (!firstName || !lastName) {
    return res.status(400).json({ error: 'You must enter your full name.' });
  }

  if (!password) {
    return res.status(400).json({ error: 'You must enter a password.' });
  }

  const existingUser = await User.findOne({ email });
  const existingTemporaryUser = await TemporaryUser.findOne({ email });
  if (existingUser || existingTemporaryUser) {
    return res
      .status(400)
      .json({ error: 'That email address is already in use.' });
  }

  const activationId = uuid.v4();
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const temporaryUser = new TemporaryUser({
    email,
    password: hash,
    firstName,
    lastName,
    activationId,
  });

  await temporaryUser.save()

  await mailer.sendMail(temporaryUser.email, 'activate', activationId);

  res.status(200).json({
    success: true,
    message: 'Please check your email for the link to activate your account.'
  });
});

router.get('/activate/:activationId', async (req, res) => {
  const { activationId } = req.params;
  const temporaryUser = await TemporaryUser.findOneAndDelete({ activationId });
  if (!temporaryUser) {
    return res.send('<h1>Invalid or expired activation id!</h1>');
  }
  const user = new User({
    email: temporaryUser.email,
    password: temporaryUser.password,
    firstName: temporaryUser.firstName,
    lastName: temporaryUser.lastName,
  });

  await user.save();
  await mailer.sendMail(user.email, 'signup', user);

  const payload = {
    id: user.id
  };

  jwt.sign(payload, secret, { expiresIn: tokenLife }, (error, token) => {
    const jwt = `Bearer ${token}`;

    const htmlWithEmbeddedJWT = `
      <html>
        <script>
          // Save JWT to localStorage
          window.localStorage.setItem('token', '${jwt}');
          // Redirect browser to root of application
          window.location.href = '/';
        </script>
      </html>
    `;

    res.send(htmlWithEmbeddedJWT);
  });
})

router.post('/forgot', limiter(), async (req, res) => {
  const email = req.body.email;

  if (!email) {
    return res.status(400).json({ error: 'You must enter an email address.' });
  }

  const existingUser = await User.findOne({ email });
  if (!existingUser) {
    return res.status(400).json({
      error: `This email - ${email} not found.`
    });
  }

  const passwordResetId = uuid.v4();
  const passwordReset = new PasswordReset({
    email,
    passwordResetId
  });

  await passwordReset.save()

  await mailer.sendMail(email, 'reset', passwordResetId);

  res.status(200).json({
    success: true,
    message: 'Please check your email for the link to reset your password.'
  });
});

router.post('/reset/:token', limiter(), async (req, res) => {
  const password = req.body.password;

  if (!password) {
    return res.status(400).json({ error: 'You must enter a password.' });
  }

  const passwordReset = await PasswordReset.findOneAndDelete({ passwordResetId: req.params.token });
  if (!passwordReset) {
    return res.status(400).json({ error: 'Invalid or expired password reset id.' });
  }

  const resetUser = await User.findOne({ email: passwordReset.email });
  if (!resetUser) {
    return res.status(400).json({ error: 'This user was deleted.' });
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(req.body.password, salt);

  resetUser.password = hash;

  await resetUser.save()
  await mailer.sendMail(resetUser.email, 'reset-confirmation');

  res.status(200).json({
    success: true,
    message: 'Password changed successfully. Please login with your new password.'
  });
});

router.get('/google',
  passport.authenticate('google', {
    session: false,
    scope: ['profile', 'email'],
    accessType: 'offline',
    approvalPrompt: 'force'
  })
);

router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    session: false
  }),
  (req, res) => {
    const payload = {
      id: req.user.id
    };

    jwt.sign(payload, secret, { expiresIn: tokenLife }, (err, token) => {
      const jwt = `Bearer ${token}`;

      const htmlWithEmbeddedJWT = `
        <html>
          <script>
            // Save JWT to localStorage
            window.localStorage.setItem('token', '${jwt}');
            // Redirect browser to root of application
            window.location.href = '/';
          </script>
        </html>
      `;

      res.send(htmlWithEmbeddedJWT);
    });
  }
);

router.get('/facebook',
  passport.authenticate('facebook', {
    session: false,
    scope: ['public_profile', 'email']
  })
);

router.get('/facebook/callback',
  passport.authenticate('facebook', {
    failureRedirect: '/',
    session: false
  }),
  (req, res) => {
    const payload = {
      id: req.user.id
    };

    jwt.sign(payload, secret, { expiresIn: tokenLife }, (err, token) => {
      const jwt = `Bearer ${token}`;

      const htmlWithEmbeddedJWT = `
        <html>
          <script>
            // Save JWT to localStorage
            window.localStorage.setItem('token', '${jwt}');
            // Redirect browser to root of application
            window.location.href = '/';
          </script>
        </html>       
      `;

      res.send(htmlWithEmbeddedJWT);
    });
  }
);

module.exports = router;
