"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
class AuthController {
    static async register(req, res) {
        try {
            const user = await auth_service_1.AuthService.registerUser(req.body);
            res.status(201).json(user);
        }
        catch (error) {
            res.status(400).json({ message: error instanceof Error ? error.message : 'An unknown error occurred' });
        }
    }
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            const { token, user } = await auth_service_1.AuthService.authenticateUser(email, password);
            res.json({ token, user });
        }
        catch (error) {
            res.status(401).json({ message: error instanceof Error ? error.message : 'An unknown error occurred' });
        }
    }
    static async forgotPassword(req, res) {
        try {
            console.log("📩 Forgot Password Request Body:", req.body);
            const email = req.body?.email;
            if (!email) {
                res.status(400).json({ message: "Email is required" });
                return;
            }
            const result = await auth_service_1.AuthService.forgotPassword(email);
            res.status(200).json({ message: result });
            return;
        }
        catch (error) {
            const err = error;
            console.error("❌ Forgot password controller error:", err.message, err);
            if (!res.headersSent) {
                res.status(500).json({
                    message: "Error processing request",
                    ...(process.env.NODE_ENV === "development" && { error: err.message }),
                });
                return;
            }
        }
    }
    static async resetPassword(req, res) {
        try {
            await auth_service_1.AuthService.resetPassword(req.body.token, req.body.newPassword);
            res.status(200).json({ message: 'Password reset successful' });
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
}
exports.AuthController = AuthController;
