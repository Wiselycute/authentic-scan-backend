const nodemailer = require('nodemailer');
const appName = process.env.APP_NAME || 'NODEMAILER';
const smtpService = process.env.SMTP_SERVICE || 'gmail';
const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure =
    typeof process.env.SMTP_SECURE === 'string' ? process.env.SMTP_SECURE === 'true' : smtpPort === 465;
const sendTimeoutMs = Number(process.env.SMTP_SEND_TIMEOUT_MS || 12000);
const smtpUser = process.env.SMTP_USER ? process.env.SMTP_USER.trim().replace(/^['\"]|['\"]$/g, '') : '';
const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM || smtpUser;

const sanitizeSmtpPass = (value) => {
    if (!value) {
        return value;
    }

    const trimmed = value.trim().replace(/^['\"]|['\"]$/g, '');

    // Gmail app passwords are often copied with spaces for readability.
    if ((smtpService || '').toLowerCase() === 'gmail') {
        return trimmed.replace(/\s+/g, '');
    }

    return trimmed;
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

const createGmail465FallbackTransport = () => {
    if ((smtpService || '').toLowerCase() !== 'gmail') {
        return null;
    }

    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
        connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 10000),
        greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 10000),
        socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 12000),
    });
};

const fallbackTransporter = createGmail465FallbackTransport();

const sendWithTimeout = async (activeTransporter, mailOptions) => {
    const sendPromise = activeTransporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`SMTP send timeout after ${sendTimeoutMs}ms`)), sendTimeoutMs);
    });

    return Promise.race([sendPromise, timeoutPromise]);
};

const sendWithResend = async (to, subject, text, html = null) => {
    if (!resendApiKey) {
        return { ok: false, error: 'RESEND_API_KEY is not configured' };
    }

    if (!resendFrom) {
        return { ok: false, error: 'RESEND_FROM is not configured' };
    }

    if (typeof fetch !== 'function') {
        return { ok: false, error: 'Global fetch is unavailable in this Node runtime' };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), sendTimeoutMs);

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: resendFrom,
                to: [to],
                subject,
                text,
                ...(html ? { html } : {}),
            }),
            signal: controller.signal,
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            const err = data?.message || data?.error || `Resend API error (${response.status})`;
            return { ok: false, error: String(err) };
        }

        return { ok: true };
    } catch (error) {
        return { ok: false, error: error?.message || String(error) };
    } finally {
        clearTimeout(timeout);
    }
};

const sendMail = async (to, subject, text, html = null) => {
    if (resendApiKey) {
        const resendResult = await sendWithResend(to, subject, text, html);
        if (resendResult.ok) {
            console.log('Email sent successfully (Resend API primary)');
            return { ok: true };
        }

        console.error('Resend API primary failed:', resendResult.error);
    }

    let primaryError = null;

    try {
        if (!smtpconfig.auth.user || !smtpconfig.auth.pass) {
            throw new Error('SMTP credentials are missing: set SMTP_USER and SMTP_PASS');
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

        await sendWithTimeout(transporter, mailOptions);
        console.log('Email sent successfully');
        return { ok: true };
    } catch (error) {
        primaryError = error && typeof error === 'object'
            ? error.response || error.code || error.message || 'Unknown SMTP error'
            : String(error);

        if (fallbackTransporter) {
            try {
                await sendWithTimeout(fallbackTransporter, {
                    from: `"${appName}" <${smtpconfig.auth.user}>`,
                    to,
                    subject,
                    text,
                    ...(html ? { html } : {}),
                });
                console.log('Email sent successfully (fallback transport)');
                return { ok: true };
            } catch (fallbackError) {
                const fallbackDetail = fallbackError && typeof fallbackError === 'object'
                    ? fallbackError.response || fallbackError.code || fallbackError.message || 'Unknown SMTP fallback error'
                    : String(fallbackError);
                console.error('Error sending email (fallback):', fallbackDetail);
                primaryError = `${primaryError}; fallback: ${fallbackDetail}`;
            }
        }

        const resendResult = resendApiKey
            ? await sendWithResend(to, subject, text, html)
            : { ok: false, error: 'RESEND_API_KEY is not configured' };
        if (resendResult.ok) {
            console.log('Email sent successfully (Resend API fallback)');
            return { ok: true };
        }

        const combinedError = `SMTP failed: ${String(primaryError)}; Resend failed: ${resendResult.error}`;
        console.error('Error sending email:', combinedError);
        return { ok: false, error: combinedError };
    }
};

module.exports = { transporter, sendMail };