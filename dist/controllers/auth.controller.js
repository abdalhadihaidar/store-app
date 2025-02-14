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
            await auth_service_1.AuthService.forgotPassword(req.body.email);
            res.status(200).json({ message: 'Password reset email sent' });
        }
        catch (error) {
            res.status(500).json({ message: 'Error processing request' });
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
