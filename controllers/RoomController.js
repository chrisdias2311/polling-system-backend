// controllers/roomController.js
const roomService = require('../services/RoomService');
const { logger } = require('../utils/logger');
const { validationResult } = require('express-validator');

class RoomController {
    async createRoom(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { teacherName } = req.body;
            const room = roomService.createRoom(teacherName);

            res.status(201).json({
                success: true,
                data: {
                    roomId: room.id,
                    teacherName: room.teacherName,
                    createdAt: room.createdAt
                }
            });
        } catch (error) {
            logger.error('Error creating room:', error);
            next(error);
        }
    }

    async getRoomInfo(req, res, next) {
        try {
            const { roomId } = req.params;
            const room = roomService.getRoom(roomId);

            if (!room) {
                return res.status(404).json({
                    success: false,
                    message: 'Room not found'
                });
            }

            res.json({
                success: true,
                data: room.toJSON()
            });
        } catch (error) {
            logger.error('Error getting room info:', error);
            next(error);
        }
    }

    async getRoomStats(req, res, next) {
        try {
            const { roomId } = req.params;
            const stats = roomService.getRoomStats(roomId);

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            logger.error('Error getting room stats:', error);
            next(error);
        }
    }

    async getAllRooms(req, res, next) {
        try {
            const rooms = roomService.getAllRooms();

            res.json({
                success: true,
                data: rooms
            });
        } catch (error) {
            logger.error('Error getting all rooms:', error);
            next(error);
        }
    }

    async checkRoomExists(req, res, next) {
        try {
            const { roomId } = req.params;
            const room = roomService.getRoom(roomId);

            res.json({
                success: true,
                data: {
                    exists: !!room,
                    isActive: room ? room.isActive : false
                }
            });
        } catch (error) {
            logger.error('Error checking room existence:', error);
            next(error);
        }
    }
}

module.exports = new RoomController();