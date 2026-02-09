const jwt = require('jsonwebtoken');

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

const createSendToken = (user, statusCode, res, rememberMe = true) => {
    const token = signToken(user._id);

    // If rememberMe is true, 30 days. Otherwise, 1 day.
    const cookieExpireDays = rememberMe ? 30 : 1;

    const cookieOptions = {
        expires: new Date(
            Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000
        ),
        httpOnly: true, // PREVENT XSS
        secure: process.env.NODE_ENV === 'production', // ONLY HTTPS IN PROD
        path: '/'
    };

    if (process.env.NODE_ENV === 'production') {
        cookieOptions.sameSite = 'none'; // Essential for Cross-Site (Vercel -> Render)
        cookieOptions.secure = true;     // Essential for SameSite=None
    } else {
        // DEVELOPMENT & LOCAL NETWORK TESTING
        // Lax allows Top-Level navigation but might block fetch if not same-origin.
        // For localhost:5173 -> localhost:5000, they are same-site but cross-origin.
        cookieOptions.sameSite = 'lax';
        cookieOptions.secure = false;
    }

    res.cookie('jwt', token, cookieOptions);

    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};

module.exports = { signToken, createSendToken };
