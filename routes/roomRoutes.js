const express = require('express');
const { body, param } = require('express-validator');
const roomController = require('../controllers/RoomController');

const router = express.Router();

// Validation middleware
const createRoomValidation = [
    body('teacherName')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Teacher name must be between 1 and 50 characters')
        .escape()
];

const roomIdValidation = [
    param('roomId')
        .isLength({ min: 6, max: 10 })
        .withMessage('Invalid room ID format')
        .isAlphanumeric()
        .withMessage('Room ID must contain only letters and numbers')
];

// Routes
router.post('/create', createRoomValidation, roomController.createRoom);
router.get('/:roomId', roomIdValidation, roomController.getRoomInfo);
router.get('/:roomId/stats', roomIdValidation, roomController.getRoomStats);
router.get('/:roomId/exists', roomIdValidation, roomController.checkRoomExists);
router.get('/', roomController.getAllRooms);

module.exports = router;