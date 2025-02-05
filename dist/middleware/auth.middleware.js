"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (roles = []) => {
    return (req, res, next) => {
        const token = req.headers['authorization'];
        if (!token) {
            res.status(401).json({ message: 'Unauthorized' });
            return; // Stop here, don't continue the request
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            if (roles.length && !roles.includes(req.user.role)) {
                res.status(403).json({ message: 'Forbidden: Access denied' });
                return; // Stop here, don't continue the request
            }
            next(); // Proceed to the next middleware/route handler
        }
        catch (error) {
            res.status(401).json({ message: 'Invalid token' });
        }
    };
};
exports.authMiddleware = authMiddleware;
