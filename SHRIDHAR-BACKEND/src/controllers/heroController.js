const Hero = require('../models/Hero');
const AppError = require('../utils/AppError');

exports.getAllHeroes = async (req, res, next) => {
    try {
        const heroes = await Hero.find({}).sort('order');
        res.status(200).json({
            status: 'success',
            results: heroes.length,
            data: {
                heroes
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.getPublicHeroes = async (req, res, next) => {
    try {
        const heroes = await Hero.find({ isActive: true }).sort('order');
        res.status(200).json({
            status: 'success',
            results: heroes.length,
            data: {
                heroes
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.createHero = async (req, res, next) => {
    try {
        const newHero = await Hero.create(req.body);
        res.status(201).json({
            status: 'success',
            data: {
                hero: newHero
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.updateHero = async (req, res, next) => {
    try {
        const hero = await Hero.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!hero) {
            return next(new AppError('No hero found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                hero
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.deleteHero = async (req, res, next) => {
    try {
        const hero = await Hero.findByIdAndDelete(req.params.id);

        if (!hero) {
            return next(new AppError('No hero found with that ID', 404));
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        next(err);
    }
};
