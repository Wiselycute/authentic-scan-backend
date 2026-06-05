const nodemailer = require('nodemailer');
const appName = process.env.APP_NAME || 'NODEMAILER';
const smtpconfig ={
    service: process.env.SMTP_SERVICE || 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
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
    const mailOptions = {
           from:`"${appName}" <${smtpconfig.auth.user}>`,
        to,
        subject,
        text
    };
    if (html) {
        mailOptions.html = html;
    }
   
   const send =  await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
       return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
    };

module.exports = { transporter, sendMail };