"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const crypto = __importStar(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const sequelize_1 = require("sequelize");
const user_model_1 = __importDefault(require("../models/user.model"));
const email_util_1 = require("../utils/email.util");
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
    static async forgotPassword(email) {
        const user = await user_model_1.default.findOne({ where: { email } });
        if (!user)
            return; // Prevent email enumeration
        const resetToken = crypto.randomBytes(20).toString('hex');
        const hashedToken = bcryptjs_1.default.hashSync(resetToken, 10);
        const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
        await user.update({
            resetPasswordToken: hashedToken,
            resetPasswordExpires,
        });
        const resetUrl = `http://yourfrontend.com/reset-password?token=${resetToken}`;
        await (0, email_util_1.sendPasswordResetEmail)(user.email, resetUrl);
    }
    static async resetPassword(token, newPassword) {
        const users = await user_model_1.default.findAll({
            where: {
                resetPasswordExpires: { [sequelize_1.Op.gt]: new Date() },
            },
        });
        const userFound = users.find(user => user.resetPasswordToken &&
            bcryptjs_1.default.compareSync(token, user.resetPasswordToken));
        if (!userFound)
            throw new Error('Invalid or expired token');
        const hashedPassword = bcryptjs_1.default.hashSync(newPassword, 10);
        await userFound.update({
            password: hashedPassword,
            resetPasswordToken: undefined,
            resetPasswordExpires: undefined,
        });
        return { message: 'Password reset successful' };
    }
}
exports.AuthService = AuthService;
