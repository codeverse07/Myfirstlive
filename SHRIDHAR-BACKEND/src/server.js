require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
// Trigger restart for env update
const socketService = require('./utils/socket'); // Import Socket Service

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Initialize Socket.io
socketService.init(server);


// Handle Unhandled Rejections
process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});
