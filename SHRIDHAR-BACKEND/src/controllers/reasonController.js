const Reason = require('../models/Reason');
const AppError = require('../utils/AppError');

exports.getAllReasons = async (req, res, next) => {
    try {
        const { type } = req.query;
        const filter = { isActive: true };
        if (type) filter.type = type.toUpperCase();

        const reasons = await Reason.find(filter);

        res.status(200).json({
            status: 'success',
            results: reasons.length,
            data: { reasons }
        });
    } catch (error) {
        next(error);
    }
};

exports.createReason = async (req, res, next) => {
    try {
        const reason = await Reason.create(req.body);
        // Socket Emission for Admin
        try {
            const socketService = require('../utils/socket');
            socketService.getIo().to('admin-room').emit('reason:created', reason);
        } catch (err) {
            console.error('Socket emission failed:', err.message);
        }

        res.status(201).json({
            status: 'success',
            data: { reason }
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteReason = async (req, res, next) => {
    try {
        const reason = await Reason.findByIdAndDelete(req.params.id);
        if (!reason) {
            return next(new AppError('No reason found with that ID', 404));
        }

        // Socket Emission for Admin
        try {
            const socketService = require('../utils/socket');
            socketService.getIo().to('admin-room').emit('reason:deleted', { id: req.params.id });
        } catch (err) {
            console.error('Socket emission failed:', err.message);
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        next(error);
    }
};
