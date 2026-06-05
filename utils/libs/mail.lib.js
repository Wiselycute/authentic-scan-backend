const nodemailer = require('nodemailer');
const appName = process.env.APP_NAME || 'NODEMAILER';
const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.MAIL_USER;
const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.MAIL_PASS;
const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_HOST || process.env.MAIL_HOST;
const smtpPort = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || process.env.MAIL_PORT || 587);
const smtpSecureEnv = process.env.SMTP_SECURE || process.env.EMAIL_SECURE || process.env.MAIL_SECURE;
const smtpSecure = typeof smtpSecureEnv === 'string'
    ? ['true', '1', 'yes'].includes(smtpSecureEnv.toLowerCase())
    : smtpPort === 465;

const createTransportConfig = () => {
    if (!smtpUser || !smtpPass) {
        return null;
    }

    if (smtpHost) {
        return {
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        };
    }

    return {
        service: process.env.SMTP_SERVICE || process.env.EMAIL_SERVICE || process.env.MAIL_SERVICE || 'gmail',
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    };
};

const transportConfig = createTransportConfig();
const transporter = transportConfig ? nodemailer.createTransport(transportConfig) : null;

const sendMail = async (to, subject, text, html = null) => {
    if (!transporter || !smtpUser || !smtpPass) {
        console.error('SMTP configuration is missing. Set SMTP_USER and SMTP_PASS, or EMAIL_USER and EMAIL_PASS.');
        return false;
    }

    try {
        const mailOptions = {
            from: `"${appName}" <${smtpUser}>`,
            to,
            subject,
            text,
        };

        if (html) {
            mailOptions.html = html;
        }

        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

module.exports = { transporter, sendMail };