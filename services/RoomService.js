// services/roomService.js
const Room = require('../models/Room');
const { logger } = require('../utils/logger');

const RoomService = class {
    constructor() {
        this.rooms = new Map(); // roomId -> Room instance
        this.userRooms = new Map(); // userId -> roomId
        this.cleanupInterval = setInterval(() => this.cleanupInactiveRooms(), 600000); // Cleanup every minute
    }

    createRoom(teacherName) {
        try {
            const room = new Room(teacherName);
            this.rooms.set(room.id, room);
            
            logger.info(`Room ${room.id} created by teacher ${teacherName}`);
            return room;
        } catch (error) {
            logger.error('Error creating room:', error);
            throw error;
        }
    }

    getRoom(roomId) {
        return this.rooms.get(roomId);
    }

    joinRoomAsTeacher(roomId, teacherId) {
        const room = this.getRoom(roomId);
        if (!room) {
            throw new Error('Room not found');
        }

        if (room.isTeacherInRoom()) {
            throw new Error('Teacher already in room');
        }

        room.setTeacher(teacherId);
        this.userRooms.set(teacherId, roomId);
        
        logger.info(`Teacher ${teacherId} joined room ${roomId}`);
        return room;
    }

    joinRoomAsStudent(roomId, studentId, studentName) {
        const room = this.getRoom(roomId);
        if (!room) {
            throw new Error('Room not found');
        }

        if (!room.isActive) {
            throw new Error('Room is not active');
        }

        room.addStudent(studentId, studentName);
        this.userRooms.set(studentId, roomId);
        
        logger.info(`Student ${studentName} (${studentId}) joined room ${roomId}`);
        return room;
    }

    leaveRoom(userId) {
        const roomId = this.userRooms.get(userId);
        if (!roomId) {
            return null;
        }

        const room = this.getRoom(roomId);
        if (!room) {
            this.userRooms.delete(userId);
            return null;
        }

        if (room.teacherId === userId) {
            // Teacher leaving - end the room
            room.isActive = false;
            room.endCurrentQuestion();
            this.userRooms.delete(userId);
            logger.info(`Teacher ${userId} left room ${roomId} - room deactivated`);
        } else {
            // Student leaving
            room.removeStudent(userId);
            this.userRooms.delete(userId);
            logger.info(`Student ${userId} left room ${roomId}`);
        }

        return room;
    }

    askQuestion(roomId, teacherId, questionData, timeLimit) {
        const room = this.getRoom(roomId);
        if (!room) {
            throw new Error('Room not found');
        }

        if (room.teacherId !== teacherId) {
            throw new Error('Only the teacher can ask questions');
        }

        // End current question if exists
        room.endCurrentQuestion();

        // Add new question
        const question = room.addQuestion(questionData);
        
        // Set timer for x seconds
        room.questionTimer = setTimeout(() => {
            room.endCurrentQuestion();
            logger.info(`Question ${question.id} in room ${roomId} timed out`);
        }, timeLimit);

        logger.info(`Question ${question.id} asked in room ${roomId}`);
        return question;
    }

    submitAnswer(roomId, studentId, questionId, selectedOption) {
        const room = this.getRoom(roomId);
        if (!room) {
            throw new Error('Room not found');
        }

        const student = room.students.get(studentId);
        if (!student || student.isKicked) {
            throw new Error('Student not found or has been kicked');
        }

        const stats = room.addResponse(questionId, studentId, selectedOption);
        logger.info(`Student ${studentId} answered question ${questionId} in room ${roomId}`);
        
        return stats;
    }

    kickStudent(roomId, teacherId, studentId) {
        const room = this.getRoom(roomId);
        if (!room) {
            throw new Error('Room not found');
        }

        if (room.teacherId !== teacherId) {
            throw new Error('Only the teacher can kick students');
        }

        const kicked = room.kickStudent(studentId);
        if (kicked) {
            logger.info(`Student ${studentId} kicked from room ${roomId}`);
        }
        
        return kicked;
    }

    addChatMessage(roomId, senderId, message) {
        const room = this.getRoom(roomId);
        if (!room) {
            throw new Error('Room not found');
        }

        let senderName, senderType;
        
        if (room.teacherId === senderId) {
            senderName = room.teacherName;
            senderType = 'teacher';
        } else {
            const student = room.students.get(senderId);
            if (!student || student.isKicked) {
                throw new Error('Student not found or has been kicked');
            }
            senderName = student.name;
            senderType = 'student';
        }

        const chatMessage = room.addChatMessage(senderId, senderName, message, senderType);
        logger.info(`Chat message from ${senderName} in room ${roomId}`);
        
        return chatMessage;
    }

    getRoomStats(roomId) {
        const room = this.getRoom(roomId);
        if (!room) {
            throw new Error('Room not found');
        }

        return {
            room: room.toJSON(),
            students: Array.from(room.getActiveStudents().entries()).map(([id, student]) => ({
                id,
                name: student.name,
                joinTime: student.joinTime
            })),
            questions: room.getAllQuestionStats(),
            chatHistory: room.chatHistory
        };
    }

    getUserRoom(userId) {
        return this.userRooms.get(userId);
    }

    cleanupInactiveRooms() {
        const now = new Date();
        const roomsToDelete = [];

        for (const [roomId, room] of this.rooms.entries()) {
            const timeSinceCreation = now - room.createdAt;
            const hasNoActiveUsers = !room.isTeacherInRoom() && room.getStudentCount() === 0;
            const isOld = timeSinceCreation > 24 * 60 * 60 * 1000; // 24 hours

            if (!room.isActive || hasNoActiveUsers || isOld) {
                roomsToDelete.push(roomId);
            }
        }

        roomsToDelete.forEach(roomId => {
            const room = this.rooms.get(roomId);
            if (room) {
                room.endCurrentQuestion();
                // Remove user mappings
                for (const [userId, userRoomId] of this.userRooms.entries()) {
                    if (userRoomId === roomId) {
                        this.userRooms.delete(userId);
                    }
                }
                this.rooms.delete(roomId);
                logger.info(`Room ${roomId} cleaned up`);
            }
        });
    }

    getAllRooms() {
        return Array.from(this.rooms.values()).map(room => room.toJSON());
    }

    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        
        // End all active questions
        for (const room of this.rooms.values()) {
            room.endCurrentQuestion();
        }
        
        this.rooms.clear();
        this.userRooms.clear();
    }
}
const roomService = new RoomService();
module.exports = roomService;
