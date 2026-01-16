#!/bin/bash
# Patch sendEmail.js inside the LibreChat container

cat > /tmp/sendEmail-patched.js << 'ENDOFFILE'
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const { logger } = require('@librechat/data-schemas');
const { logAxiosError, isEnabled, readFileAsString } = require('@librechat/api');

/**
 * Sends an email using Mailgun API.
 *
 * @async
 * @function sendEmailViaMailgun
 * @param {Object} params - The parameters for sending the email.
 * @param {string} params.to - The recipient's email address.
 * @param {string} params.from - The sender's email address.
 * @param {string} params.subject - The subject of the email.
 * @param {string} params.html - The HTML content of the email.
 * @returns {Promise<Object>} - A promise that resolves to the response from Mailgun API.
 */
const sendEmailViaMailgun = async ({ to, from, subject, html }) => {
  const mailgunApiKey = process.env.MAILGUN_API_KEY;
  const mailgunDomain = process.env.MAILGUN_DOMAIN;
  const mailgunHost = process.env.MAILGUN_HOST || 'https://api.mailgun.net';

  if (!mailgunApiKey || !mailgunDomain) {
    throw new Error('Mailgun API key and domain are required');
  }

  const formData = new FormData();
  formData.append('from', from);
  formData.append('to', to);
  formData.append('subject', subject);
  formData.append('html', html);
  formData.append('o:tracking-clicks', 'no');

  try {
    const response = await axios.post(`${mailgunHost}/v3/${mailgunDomain}/messages`, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Basic ${Buffer.from(`api:${mailgunApiKey}`).toString('base64')}`,
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(logAxiosError({ error, message: 'Failed to send email via Mailgun' }));
  }
};

/**
 * Sends an email using SMTP via Nodemailer.
 *
 * @async
 * @function sendEmailViaSMTP
 * @param {Object} params - The parameters for sending the email.
 * @param {Object} params.transporterOptions - The transporter configuration options.
 * @param {Object} params.mailOptions - The email options.
 * @returns {Promise<Object>} - A promise that resolves to the info object of the sent email.
 */
const sendEmailViaSMTP = async ({ transporterOptions, mailOptions }) => {
  const transporter = nodemailer.createTransport(transporterOptions);
  return await transporter.sendMail(mailOptions);
};

/**
 * Sends an email using the specified template, subject, and payload.
 *
 * @async
 * @function sendEmail
 * @param {Object} params - The parameters for sending the email.
 * @param {string} params.email - The recipient's email address.
 * @param {string} params.subject - The subject of the email.
 * @param {Record<string, string>} params.payload - The data to be used in the email template.
 * @param {string} params.template - The filename of the email template.
 * @param {boolean} [throwError=true] - Whether to throw an error if the email sending process fails.
 * @returns {Promise<Object>} - A promise that resolves to the info object of the sent email or the error if sending the email fails.
 *
 * @example
 * const emailData = {
 *   email: 'recipient@example.com',
 *   subject: 'Welcome!',
 *   payload: { name: 'Recipient' },
 *   template: 'welcome.html'
 * };
 *
 * sendEmail(emailData)
 *   .then(info => console.log('Email sent:', info))
 *   .catch(error => console.error('Error sending email:', error));
 *
 * @throws Will throw an error if the email sending process fails and throwError is `true`.
 */
const sendEmail = async ({ email, subject, payload, template, throwError = true }) => {
  try {
    const { content: source } = await readFileAsString(path.join(__dirname, 'emails', template));
    const compiledTemplate = handlebars.compile(source);
    const html = compiledTemplate(payload);

    // Prepare common email data
    const fromName = process.env.EMAIL_FROM_NAME || process.env.APP_TITLE;
    const fromEmail = process.env.EMAIL_FROM;
    const fromAddress = `"${fromName}" <${fromEmail}>`;
    const toAddress = `"${payload.name}" <${email}>`;

    // Check if Mailgun is configured
    if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
      logger.debug('[sendEmail] Using Mailgun provider');
      return await sendEmailViaMailgun({
        from: fromAddress,
        to: toAddress,
        subject: subject,
        html: html,
      });
    }

    // Default to SMTP
    logger.debug('[sendEmail] Using SMTP provider');
    
    // Configure SMTP transporter with proper TLS/SSL settings
    const port = Number(process.env.EMAIL_PORT) || 25;
    const enc = (process.env.EMAIL_ENCRYPTION || '').toLowerCase();
    const useImplicitTLS = port === 465 || enc === 'ssl';
    const useStartTLS = port === 587 || enc === 'tls' || enc === 'starttls';

    const transporterOptions = {
      host: process.env.EMAIL_HOST,
      port,
      secure: useImplicitTLS,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: !isEnabled(process.env.EMAIL_ALLOW_SELFSIGNED),
      },
    };

    // Only set requireTLS for STARTTLS (port 587), not for implicit TLS (port 465)
    if (useStartTLS && !useImplicitTLS) {
      transporterOptions.requireTls = true;
    }

    if (process.env.EMAIL_ENCRYPTION_HOSTNAME) {
      transporterOptions.tls.servername = process.env.EMAIL_ENCRYPTION_HOSTNAME;
    }

    // Log SMTP configuration (without sensitive data)
    logger.info('[sendEmail] SMTP transporter options', {
      host: transporterOptions.host,
      port: transporterOptions.port,
      secure: transporterOptions.secure,
      requireTls: transporterOptions.requireTls,
      encryption: process.env.EMAIL_ENCRYPTION,
    });

    const mailOptions = {
      from: fromAddress,
      to: toAddress,
      envelope: {
        from: fromEmail,
        to: email,
      },
      subject: subject,
      html: html,
    };

    return await sendEmailViaSMTP({ transporterOptions, mailOptions });
  } catch (error) {
    if (throwError) {
      throw error;
    }
    logger.error('[sendEmail]', error);
    return error;
  }
};

module.exports = sendEmail;
ENDOFFILE

# Copy the patched file into the container
docker cp /tmp/sendEmail-patched.js LibreChat:/app/api/server/utils/sendEmail.js

echo "✅ Patched /app/api/server/utils/sendEmail.js inside container"
