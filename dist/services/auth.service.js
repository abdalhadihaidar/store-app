"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const sequelize_1 = require("sequelize");
const user_model_1 = __importDefault(require("../models/user.model"));
const jwt_util_1 = require("../utils/jwt.util");
const email_util_1 = require("../utils/email.util");
class AuthService {
    static async registerUser(userData) {
        const existingUser = await user_model_1.default.findOne({ where: { email: userData.email } });
        if (existingUser)
            throw new Error('User already exists');
        userData.password = bcryptjs_1.default.hashSync(userData.password, 10);
        const user = await user_model_1.default.create(userData); // TypeScript will now recognize this correctly
        return user;
    }
    static async authenticateUser(email, password) {
        const user = await user_model_1.default.findOne({ where: { email } });
        if (!user || !bcryptjs_1.default.compareSync(password, user.password)) {
            throw new Error('Invalid credentials');
        }
        const token = (0, jwt_util_1.generateToken)(user.id, user.role); // Correctly typed now
        return { token, user };
    }
    static async forgotPassword(email) {
        try {
            // Find user by email
            const user = await user_model_1.default.findOne({ where: { email } });
            if (!user)
                throw new Error("User not found");
            // Generate and store hashed token
            const resetToken = Math.random().toString(36).substring(2, 12);
            const hashedToken = bcryptjs_1.default.hashSync(resetToken, 12);
            // Set expiration (30 minutes from now)
            const expirationDate = new Date(Date.now() + 30 * 60 * 1000);
            await user.update({
                resetPasswordToken: hashedToken,
                resetPasswordExpires: expirationDate
            });
            // Send email
            const emailResponse = await (0, email_util_1.sendEmail)(email, "User", "Reset Your Password - Action Required", `
        <p>Hallo,</p>
          <p>Wir haben eine Anfrage zum Zurücksetzen Ihres Passworts erhalten. Wenn Sie diese Anfrage gestellt haben, klicken Sie bitte auf die Schaltfläche unten, um Ihr Passwort zurückzusetzen:</p>
          <p style="text-align: center;">
          <a href="https://dashboard.brother-investment-group.com/reset-password/${resetToken}"
               style="display: inline-block; padding: 12px 20px; hintergrundfarbe: #007bff; farbe: #ffffff; textdekoration: keine; schriftstärke: fett; randradius: 5px;">
               Passwort zurücksetzen
            </a>
          </p>
          <p>Wenn Sie keine Passwort-Zurücksetzung angefordert haben, können Sie diese E-Mail getrost ignorieren.</p>
          <p>Aus Sicherheitsgründen läuft dieser Link in 30 Minuten ab.</p>
          <p>Mit freundlichen Grüßen</p>
          <p><strong>Brother Investment Group</strong></p>
        `);
            return "Password reset email sent successfully.";
        }
        catch (error) {
            throw new Error("Failed to process password reset request.");
        }
    }
    static async resetPassword(token, newPassword) {
        if (!token || !newPassword) {
            throw new Error('Missing required parameters');
        }
        // Find user with valid token and expiration date
        const user = await user_model_1.default.findOne({
            where: {
                resetPasswordExpires: { [sequelize_1.Op.gt]: new Date() }, // Ensure token is not expired
                resetPasswordToken: { [sequelize_1.Op.eq]: token } // Match the plain token (no hashing)
            }
        });
        if (!user)
            throw new Error('Invalid or expired token');
        // Validate new password length
        if (newPassword.length < 8) {
            throw new Error('Password must be at least 8 characters');
        }
        // Ensure new password is different from the current password
        if (bcryptjs_1.default.compareSync(newPassword, user.password)) {
            throw new Error('New password must be different');
        }
        // Hash the new password
        const hashedPassword = bcryptjs_1.default.hashSync(newPassword, 12);
        // Update user password and reset token data
        await user.update({
            password: hashedPassword,
            resetPasswordToken: null,
            resetPasswordExpires: null
        });
        return { message: 'Password reset successful' };
    }
}
exports.AuthService = AuthService;
