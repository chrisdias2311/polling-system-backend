// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const roomRoutes = require('./routes/roomRoutes');
const socketHandler = require('./sockets/socketHandler');
const errorHandler = require('./middleware/errorHandler');

const { logger } = require('./utils/logger');

class Server {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        const allowedOrigins = [
            process.env.CLIENT_URL || "http://localhost:3000",
            "http://localhost:3000",
            "http://localhost:5173",
            "https://polling-system-frontend.web.app"
        ];
        this.io = socketIo(this.server, {
            cors: {
                origin: allowedOrigins,
                methods: ["GET", "POST"],
                credentials: true
            }
        });
        this.port = process.env.PORT || 5000;
        
        this.initializeMiddleware(allowedOrigins);
        this.initializeRoutes();
        this.initializeSocketHandlers();
        this.initializeErrorHandling();
    }

    initializeMiddleware(allowedOrigins) {
        // Security middleware
        this.app.use(helmet());
        
        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100 // limit each IP to 100 requests per windowMs
        });
        this.app.use(limiter);

        // CORS
        this.app.use(cors({
            origin: allowedOrigins,
            credentials: true
        }));

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        // Logging
        this.app.use(morgan('combined', { stream: { write: message => logger.info(message) } }));
    }

    initializeRoutes() {
        this.app.use('/api/rooms', roomRoutes);
        
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
        });
    }

    initializeSocketHandlers() {
        socketHandler(this.io);
    }

    initializeErrorHandling() {
        this.app.use(errorHandler);
    }

    start() {
        this.server.listen(this.port, () => {
            logger.info(`Server running on port ${this.port}`);
        });
    }
}

const server = new Server();
server.start();

module.exports = server;