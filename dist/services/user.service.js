"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
class UserService {
    static async getAllUsers() {
        return await user_model_1.default.findAll();
    }
    static async getUserById(userId) {
        const user = await user_model_1.default.findByPk(userId);
        if (!user)
            throw new Error('User not found');
        return user;
    }
    static async updateUser(userId, updateData) {
        const user = await user_model_1.default.findByPk(userId);
        if (!user)
            throw new Error('User not found');
        return await user.update(updateData);
    }
    static async deleteUser(userId) {
        const user = await user_model_1.default.findByPk(userId);
        if (!user)
            throw new Error('User not found');
        await user.destroy();
    }
}
exports.UserService = UserService;
