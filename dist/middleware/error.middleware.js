"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, _req, res, next) => {
    // Handle case where response is already sent
    if (res.headersSent) {
        return next(err);
    }
    // Handle different error types
    const statusCode = err.name === 'ValidationError' ? 400 : 500;
    // Ensure response object exists
    if (!res || typeof res.status !== 'function') {
        // console.error('Fatal error: Invalid response object');
        return process.exit(1);
    }
    res.status(statusCode).json({
        error: {
            message: process.env.NODE_ENV === 'production'
                ? 'Something went wrong'
                : err.message,
            stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
        }
    });
};
exports.errorHandler = errorHandler;
