const nodemailer = require('nodemailer');

const keys = require('../config/keys');
const template = require('../config/template');

class MailService {

    constructor() {
      this.transporter = nodemailer.createTransport({
        host: keys.mailer.host,
        port: keys.mailer.port,
        secure: false,
        auth: {
          user: keys.mailer.user,
          pass: keys.mailer.password,
        }
      });
    }

    static prepareTemplate(type, data) {
      let message;
    
      switch (type) {
        case 'reset':
          message = template.resetEmail(data);
          break;
    
        case 'reset-confirmation':
          message = template.confirmResetPasswordEmail();
          break;
    
        case 'signup':
          message = template.signupEmail(data);
          break;
    
        case 'activate':
          message = template.activationEmail(data);
          break;
    
        default:
          message = { subject: '', text: '' };
      }
    
      return message;
    };

    async sendMail(to, type, data) {
      try {
        const { subject, html } = MailService.prepareTemplate(type, data);
        await this.transporter.sendMail({
          from: keys.mailer.user,
          to,
          subject,
          text: '',
          html,
        });
      } catch(error) {
        console.error(error);
      }
    }
}

module.exports = new MailService();
