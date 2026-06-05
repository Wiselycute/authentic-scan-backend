const nodemailer = require('nodemailer');
const appName = process.env.APP_NAME || 'NODEMAILER';
const smtpService = process.env.SMTP_SERVICE || 'gmail';
const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure =
    typeof process.env.SMTP_SECURE === 'string' ? process.env.SMTP_SECURE === 'true' : smtpPort === 465;
const sendTimeoutMs = Number(process.env.SMTP_SEND_TIMEOUT_MS || 12000);

const smtpconfig = {
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 10000),
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 10000),
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 12000),
};

if (smtpHost) {
    smtpconfig.host = smtpHost;
    smtpconfig.port = smtpPort;
    smtpconfig.secure = smtpSecure;
} else {
    smtpconfig.service = smtpService;
}


// const transporter = nodemailer.createTransport({
//     service: smtpconfig.service,
//     auth: {
//         user: smtpconfig.auth.user,
//         pass: smtpconfig.auth.pass
//     }
// });
const transporter = nodemailer.createTransport(smtpconfig);
const sendMail = async (to, subject, text, html = null) => {
    try {
        if (!smtpconfig.auth.user || !smtpconfig.auth.pass) {
            console.error('SMTP credentials are missing: set SMTP_USER and SMTP_PASS');
            return false;
        }

    const mailOptions = {
            from: `"${appName}" <${smtpconfig.auth.user}>`,
            to,
            subject,
            text,
    };
    if (html) {
            mailOptions.html = html;
    }

        const sendPromise = transporter.sendMail(mailOptions);
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`SMTP send timeout after ${sendTimeoutMs}ms`)), sendTimeoutMs);
        });

        await Promise.race([sendPromise, timeoutPromise]);
        console.log('Email sent successfully');
        return true;
    } catch (error) {
        console.error('Error sending email:', error.message || error);
        return false;
    }
};

module.exports = { transporter, sendMail };