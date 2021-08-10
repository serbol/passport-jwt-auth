const keys = require('./keys');

exports.resetEmail = (code) => {
  const message = {
    subject: 'Reset Password',
    html:
      `<p>You are receiving this because you have requested to reset your password for your account.<br />
        Please click on the following link, or paste this into your browser to complete the process: <a href="${keys.app.clientURL}/?resetPasswordId=${code}#reset">${code}</a><br/>
      If you did not request this, please ignore this email and your password will remain unchanged.</p>`
  };

  return message;
};

exports.confirmResetPasswordEmail = () => {
  const message = {
    subject: 'Password Changed',
    html:
      `<p>You are receiving this email because you changed your password.<br/>If you did not request this change, please contact us immediately.`
  };

  return message;
};

exports.signupEmail = (user) => {
  const message = {
    subject: 'Account Registration',
    html: `<h3>Hi ${user.firstName} ${user.lastName}! Thank you for creating an account with us!.</h3>`
  };

  return message;
};

exports.activationEmail = (code) => {
  const message = {
    subject: 'Account Activation',
    html: `<h3>Your activation code: <a href="${keys.app.clientURL}/${keys.app.apiURL}/auth/activate/${code}">${code}</a></h3>`
  };

  return message;
};

