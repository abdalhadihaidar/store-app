"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_model_1 = __importDefault(require("../models/user.model"));
const jwt_util_1 = require("../utils/jwt.util");
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
}
exports.AuthService = AuthService;
