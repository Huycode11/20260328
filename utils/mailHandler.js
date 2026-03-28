const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: "91671bda2d4093",
        pass: "048fd3c68d85af"
    }
});
module.exports = {
    sendMail: async (to, subject, text, html) => {
        const info = await transporter.sendMail({
            from: 'admin@haha.com',
            to: to,
            subject: subject,
            text: text, // Plain-text version of the message
            html: html, // HTML version of the message
        });

        console.log("Message sent:", info.messageId);
        return info;
    },
    sendUserCredentials: async (to, username, password) => {
        const subject = "Your New User Account Credentials";
        const text = `Hello ${username},\n\nYour account has been created.\nUsername: ${username}\nPassword: ${password}\n\nPlease change your password after logging in.`;
        const html = `<h3>Hello ${username},</h3><p>Your account has been created.</p><ul><li><b>Username:</b> ${username}</li><li><b>Password:</b> ${password}</li></ul><p>Please change your password after logging in.</p>`;

        return await module.exports.sendMail(to, subject, text, html);
    }
}