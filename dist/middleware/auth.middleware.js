"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (roles = []) => {
    return (req, res, next) => {
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ message: 'Unauthorized: No token provided' });
            return;
        }
        const token = authHeader.split(' ')[1]; // ✅ Extract token correctly
        try {
            if (!process.env.JWT_SECRET)
                throw new Error("JWT_SECRET is missing");
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            if (roles.length && !roles.includes(req.user.role)) {
                res.status(403).json({ message: 'Forbidden: Access denied' });
                return;
            }
            next(); // Proceed to next middleware/route handler
        }
        catch (error) {
            res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }
    };
};
exports.authMiddleware = authMiddleware;
