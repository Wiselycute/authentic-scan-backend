const nodemailer = require('nodemailer');
const appName = process.env.APP_NAME || 'NODEMAILER';
const smtpService = process.env.SMTP_SERVICE || 'gmail';
const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure =
    typeof process.env.SMTP_SECURE === 'string' ? process.env.SMTP_SECURE === 'true' : smtpPort === 465;
const sendTimeoutMs = Number(process.env.SMTP_SEND_TIMEOUT_MS || 12000);
const smtpUser = process.env.SMTP_USER;

const sanitizeSmtpPass = (value) => {
    if (!value) {
        return value;
    }

    // Gmail app passwords are often copied with spaces for readability.
    if ((smtpService || '').toLowerCase() === 'gmail') {
        return value.replace(/\s+/g, '');
    }

    return value;
};

const smtpPass = sanitizeSmtpPass(process.env.SMTP_PASS);

const smtpconfig = {
    auth: {
        user: smtpUser,
        pass: smtpPass,
    },
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 10000),
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 10000),
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 12000),
};

if (smtpHost) {
    smtpconfig.host = smtpHost;
    smtpconfig.port = smtpPort;
    smtpconfig.secure = smtpSecure;
} else if ((smtpService || '').toLowerCase() === 'gmail') {
    smtpconfig.host = 'smtp.gmail.com';
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
            const errorMessage = 'SMTP credentials are missing: set SMTP_USER and SMTP_PASS';
            console.error(errorMessage);
            return { ok: false, error: errorMessage };
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
        return { ok: true };
    } catch (error) {
        const detail = error && typeof error === 'object'
            ? error.response || error.code || error.message || 'Unknown SMTP error'
            : String(error);
        console.error('Error sending email:', detail);
        return { ok: false, error: String(detail) };
    }
};

module.exports = { transporter, sendMail };