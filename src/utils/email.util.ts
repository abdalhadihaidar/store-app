import nodemailer from 'nodemailer';


// Configure transporter
const transporter = nodemailer.createTransport({
  service: 'Gmail', // Use your email service (e.g., SendGrid, Mailgun)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendPasswordResetEmail = async (email: string, resetUrl: string) => {
  const mailOptions: EmailOptions = {
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
      from: `"Brother Investment Group" <${process.env.EMAIL_FROM}>`,
      ...mailOptions,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send password reset email');
  }
};