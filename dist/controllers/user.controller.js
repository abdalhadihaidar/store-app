"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_service_1 = require("../services/user.service");
class UserController {
    static async getAllUsers(_req, res) {
        try {
            const users = await user_service_1.UserService.getAllUsers();
            res.json(users);
        }
        catch (error) {
            res.status(400).json({ message: error instanceof Error ? error.message : 'An unknown error occurred' });
        }
    }
    static async getUserById(req, res) {
        try {
            const userId = Number(req.params.userId);
            const user = await user_service_1.UserService.getUserById(userId);
            res.json(user);
        }
        catch (error) {
            res.status(404).json({ message: error instanceof Error ? error.message : 'An unknown error occurred' });
        }
    }
    static async updateUser(req, res) {
        try {
            // console.log(req.params.userId)
            const userId = Number(req.params.userId);
            // console.log(userId)
            const user = await user_service_1.UserService.updateUser(userId, req.body);
            res.json(user);
        }
        catch (error) {
            res.status(400).json({ message: error instanceof Error ? error.message : 'An unknown error occurred' });
        }
    }
    static async deleteUser(req, res) {
        try {
            const userId = Number(req.params.userId);
            await user_service_1.UserService.deleteUser(userId);
            res.json({ message: 'User deleted successfully' });
        }
        catch (error) {
            res.status(400).json({ message: error instanceof Error ? error.message : 'An unknown error occurred' });
        }
    }
}
exports.UserController = UserController;
