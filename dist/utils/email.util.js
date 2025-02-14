"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPasswordResetEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
// Configure transporter
const transporter = nodemailer_1.default.createTransport({
    service: 'Gmail', // Use your email service (e.g., SendGrid, Mailgun)
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
const sendPasswordResetEmail = async (email, resetUrl) => {
    const mailOptions = {
        to: email,
        subject: 'Password Reset Request',
        html: `
      <p>You requested a password reset. Click the link below to continue:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
    `,
    };
    try {
        await transporter.sendMail({
            from: `"Your App Name" <${process.env.EMAIL_FROM}>`,
            ...mailOptions,
        });
    }
    catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send password reset email');
    }
};
exports.sendPasswordResetEmail = sendPasswordResetEmail;
