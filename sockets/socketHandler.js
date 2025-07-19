// sockets/socketHandler.js
const roomService = require('../services/RoomService')
const { generateRoomId } = require('../utils/helpers')
const { logger } = require('../utils/logger');

const socketHandler = (io) => {
    io.on('connection', (socket) => {
        logger.info(`User connected: ${socket.id}`);

        socket.on('join-as-teacher', async (data) => {
            try {
                // const { teacherName } = data;
                const teacherName = "Maam";

                // Generate unique IDs
                const teacherId = socket.id; // or uuidv4() if you want a different id
                const room = roomService.createRoom(teacherName)

                room.setTeacher(teacherId);

                // Save the room with the generated roomId (if your createRoom doesn't already do this)
                roomService.rooms.set(room.id, room);

                // Join the socket to the room
                socket.join(room.id);
                socket.userRole = 'teacher';
                socket.roomId = room.id;
                socket.userName = teacherName;

                // Emit confirmation to the teacher
                socket.emit('get-room-id', {
                    success: true,
                    roomId: room.id,
                    teacherId: teacherId,
                    role: 'teacher',
                    message: 'Room created and joined as teacher'
                });

                // Optionally, broadcast to others if needed
                logger.info(`Teacher ${teacherName} created and joined room ${room.id}`);
            } catch (error) {
                logger.error('Error joining as teacher:', error);
                socket.emit('error', {
                    message: error.message || 'Failed to join as teacher'
                });
            }
        });

        // Join room as teacher
        // socket.on('join-as-teacher', async (data) => {
        //     try {
        //         const { roomId, teacherName } = data;

        //         const room = roomService.joinRoomAsTeacher(roomId, socket.id);

        //         socket.join(roomId);
        //         socket.userRole = 'teacher';
        //         socket.roomId = roomId;
        //         socket.userName = teacherName;

        //         socket.emit('joined-room', {
        //             success: true,
        //             roomId: room.id,
        //             role: 'teacher',
        //             message: 'Successfully joined as teacher'
        //         });

        //         // Notify all students in the room that teacher has joined
        //         socket.to(roomId).emit('teacher-joined', {
        //             teacherName: room.teacherName,
        //             message: 'Teacher has joined the room'
        //         });

        //         logger.info(`Teacher ${teacherName} joined room ${roomId}`);
        //     } catch (error) {
        //         logger.error('Error joining as teacher:', error);
        //         socket.emit('error', {
        //             message: error.message || 'Failed to join as teacher'
        //         });
        //     }
        // });

        // Join room as student
        socket.on('join-as-student', async (data) => {
            try {
                const { roomId, studentName } = data;

                const room = roomService.joinRoomAsStudent(roomId, socket.id, studentName);

                socket.join(roomId);
                socket.userRole = 'student';
                socket.roomId = roomId;
                socket.userName = studentName;

                socket.emit('joined-room', {
                    success: true,
                    roomId: room.id,
                    role: 'student',
                    message: 'Successfully joined as student'
                });

                // Notify teacher and other students
                socket.to(roomId).emit('student-joined', {
                    studentName,
                    studentCount: room.getStudentCount(),
                    message: `${studentName} joined the room`
                });

                // Send current question if there's one active
                if (room.currentQuestion) {
                    socket.emit('new-question', {
                        question: room.currentQuestion,
                        timeLeft: 60 // You might want to calculate actual time left
                    });
                }

                logger.info(`Student ${studentName} joined room ${roomId}`);
            } catch (error) {
                logger.error('Error joining as student:', error);
                socket.emit('error', {
                    message: error.message || 'Failed to join as student'
                });
            }
        });

        // Ask question (teacher only)
        socket.on('ask-question', async (data) => {
            try {
                if (socket.userRole !== 'teacher') {
                    socket.emit('error', { message: 'Only teachers can ask questions' });
                    return;
                }

                const { question, options } = data;
                const roomId = socket.roomId;

                const questionData = roomService.askQuestion(roomId, socket.id, {
                    question,
                    options
                });

                // Broadcast question to all students in the room
                socket.to(roomId).emit('new-question', {
                    question: questionData,
                    timeLeft: 60
                });

                // Confirm to teacher
                socket.emit('question-asked', {
                    success: true,
                    question: questionData,
                    message: 'Question sent to all students'
                });

                // Set up automatic question end after 60 seconds
                setTimeout(() => {
                    const room = roomService.getRoom(roomId);
                    if (room && room.currentQuestion && room.currentQuestion.id === questionData.id) {
                        const stats = room.getQuestionStats(questionData.id);
                        io.to(roomId).emit('question-ended', {
                            questionId: questionData.id,
                            stats
                        });
                    }
                }, 60000);

                logger.info(`Question asked in room ${roomId}`);
            } catch (error) {
                logger.error('Error asking question:', error);
                socket.emit('error', {
                    message: error.message || 'Failed to ask question'
                });
            }
        });

        // Submit answer (student only)
        socket.on('submit-answer', async (data) => {
            try {
                if (socket.userRole !== 'student') {
                    socket.emit('error', { message: 'Only students can submit answers' });
                    return;
                }

                const { questionId, selectedOption } = data;
                const roomId = socket.roomId;

                const stats = roomService.submitAnswer(roomId, socket.id, questionId, selectedOption);

                // Confirm to student
                socket.emit('answer-submitted', {
                    success: true,
                    questionId,
                    selectedOption,
                    stats
                });

                // Send real-time stats to teacher
                const room = roomService.getRoom(roomId);
                if (room && room.teacherId) {
                    io.to(room.teacherId).emit('answer-stats-update', {
                        questionId,
                        stats
                    });
                }

                logger.info(`Answer submitted by student ${socket.id} in room ${roomId}`);
            } catch (error) {
                logger.error('Error submitting answer:', error);
                socket.emit('error', {
                    message: error.message || 'Failed to submit answer'
                });
            }
        });

        // Send chat message
        socket.on('send-message', async (data) => {
            try {
                const { message } = data;
                const roomId = socket.roomId;

                if (!roomId) {
                    socket.emit('error', { message: 'You are not in a room' });
                    return;
                }

                const chatMessage = roomService.addChatMessage(roomId, socket.id, message);

                // Broadcast message to all users in the room
                io.to(roomId).emit('new-message', chatMessage);

                logger.info(`Chat message sent in room ${roomId}`);
            } catch (error) {
                logger.error('Error sending message:', error);
                socket.emit('error', {
                    message: error.message || 'Failed to send message'
                });
            }
        });

        // Kick student (teacher only)
        socket.on('kick-student', async (data) => {
            try {
                if (socket.userRole !== 'teacher') {
                    socket.emit('error', { message: 'Only teachers can kick students' });
                    return;
                }

                const { studentId } = data;
                const roomId = socket.roomId;

                const kicked = roomService.kickStudent(roomId, socket.id, studentId);

                if (kicked) {
                    // Notify the kicked student
                    io.to(studentId).emit('kicked-from-room', {
                        message: 'You have been removed from the room by the teacher'
                    });

                    // Force disconnect the student
                    const studentSocket = io.sockets.sockets.get(studentId);
                    if (studentSocket) {
                        studentSocket.leave(roomId);
                        studentSocket.disconnect();
                    }

                    // Notify other users in the room
                    socket.to(roomId).emit('student-kicked', {
                        studentId,
                        message: 'A student has been removed from the room'
                    });

                    socket.emit('student-kicked-success', {
                        success: true,
                        studentId,
                        message: 'Student has been kicked from the room'
                    });
                }

                logger.info(`Student ${studentId} kicked from room ${roomId}`);
            } catch (error) {
                logger.error('Error kicking student:', error);
                socket.emit('error', {
                    message: error.message || 'Failed to kick student'
                });
            }
        });

        // Get room stats
        socket.on('get-room-stats', async () => {
            try {
                const roomId = socket.roomId;
                if (!roomId) {
                    socket.emit('error', { message: 'You are not in a room' });
                    return;
                }

                const stats = roomService.getRoomStats(roomId);
                socket.emit('room-stats', stats);
            } catch (error) {
                logger.error('Error getting room stats:', error);
                socket.emit('error', {
                    message: error.message || 'Failed to get room stats'
                });
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            try {
                const roomId = socket.roomId;
                const userName = socket.userName;
                const userRole = socket.userRole;

                if (roomId) {
                    const room = roomService.leaveRoom(socket.id);

                    if (room) {
                        if (userRole === 'teacher') {
                            // Notify all students that teacher left and room is closed
                            socket.to(roomId).emit('teacher-left', {
                                message: 'Teacher has left the room. Room is now closed.'
                            });
                        } else if (userRole === 'student') {
                            // Notify others that student left
                            socket.to(roomId).emit('student-left', {
                                studentName: userName,
                                studentCount: room.getStudentCount(),
                                message: `${userName} left the room`
                            });
                        }
                    }
                }

                logger.info(`User disconnected: ${socket.id} (${userName || 'unknown'})`);
            } catch (error) {
                logger.error('Error handling disconnect:', error);
            }
        });
    });
};

module.exports = socketHandler;