const Settings = require('../models/Settings');
const AppError = require('../utils/AppError');

module.exports = async (req, res, next) => {
    try {
        // Skip maintenance check for admin and auth routes
        if (req.originalUrl.includes('/api/v1/admin') || req.originalUrl.includes('/api/v1/auth')) {
            return next();
        }

        // Also skip for the maintenance status check itself if we add it
        if (req.originalUrl.includes('/maintenance-status')) {
            return next();
        }

        const settings = await Settings.findOne({ isGlobal: true });

        if (settings && settings.maintenanceMode) {
            // Check if user is admin (even on non-admin routes, admins should pass)
            if (req.user && req.user.role === 'ADMIN') {
                return next();
            }

            return res.status(503).json({
                status: 'fail',
                message: 'MAINTENANCE_MODE',
                data: {
                    maintenanceMessage: settings.maintenanceMessage,
                    maintenanceEndTime: settings.maintenanceEndTime
                }
            });
        }

        next();
    } catch (error) {
        next(error);
    }
};
