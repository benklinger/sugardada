const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Sends an email via SendGrid
 * @param {Object} options
 * @param {string} options.to       - Recipient email
 * @param {string} options.subject  - Email subject
 * @param {string} options.text     - Plaintext content
 * @param {string} [options.html]   - HTML content
 */
async function sendMail({ to, subject, text, html }) {
  const msg = {
    to,
    from: 'noreply@sugardada.app', // must be verified in SendGrid
    subject,
    text,
    html
  };
  try {
    await sgMail.send(msg);
  } catch (err) {
    throw err;
  }
}

module.exports = {
  sendMail
};
