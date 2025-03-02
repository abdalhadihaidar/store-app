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
            console.log("📨 Forgot password request received for:", email);
            // Simulate checking if user exists (Replace with database query)
            if (!email.includes("@")) {
                throw new Error("Invalid email format");
            }
            // Generate reset token (Replace with actual logic)
            const resetToken = Math.random().toString(36).substring(2, 12);
            // Send email
            const emailResponse = await (0, email_util_1.sendEmail)(email, "User", "Reset Your Password - Action Required", `
          <p>Hi there,</p>
          <p>We received a request to reset your password. If you made this request, please click the button below to reset your password:</p>
          <p style="text-align: center;">
          <a href="https://dashboard.brother-investment-group.com/reset-password/${resetToken}"
               style="display: inline-block; padding: 12px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 5px;">
               Reset Password
            </a>
          </p>
          <p>If you did not request a password reset, you can safely ignore this email.</p>
          <p>For security reasons, this link will expire in 30 minutes.</p>
          <p>Best regards,</p>
          <p><strong>Brother Investment Group</strong></p>
        `);
            console.log("✅ Reset email sent:", emailResponse);
            return "Password reset email sent successfully.";
        }
        catch (error) {
            console.error("❌ Forgot password service error:", error.message);
            throw new Error("Failed to process password reset request.");
        }
    }
    static async resetPassword(token, newPassword) {
        if (!token || !newPassword) {
            throw new Error('Missing required parameters');
        }
        if (newPassword.length < 8) {
            throw new Error('Password must be at least 8 characters');
        }
        const users = await user_model_1.default.findAll({
            where: {
                resetPasswordExpires: { [sequelize_1.Op.gt]: new Date() },
            },
        });
        const userFound = users.find(user => user.resetPasswordToken &&
            bcryptjs_1.default.compareSync(token, user.resetPasswordToken));
        if (!userFound)
            throw new Error('Invalid or expired token');
        // Additional security: Check if password is different from previous
        if (bcryptjs_1.default.compareSync(newPassword, userFound.password)) {
            throw new Error('New password must be different from current password');
        }
        const hashedPassword = bcryptjs_1.default.hashSync(newPassword, 12);
        await userFound.update({
            password: hashedPassword,
            resetPasswordToken: null,
            resetPasswordExpires: null,
        });
        return { message: 'Password reset successful' };
    }
}
exports.AuthService = AuthService;
