const { v4: uuidv4 } = require('uuid');
const { shouldCreateCustomRoomId } = require('../utils/flags');

class Room {
    constructor(teacherName) {
        this.id = shouldCreateCustomRoomId() ? uuidv4().substring(0, 8).toUpperCase() : '000000';
        this.teacherName = teacherName;
        this.teacherId = null;
        this.students = new Map(); // studentId -> {name, joinTime, isKicked}
        this.questions = []; // Array of questions asked
        this.currentQuestion = null;
        this.questionTimer = null;
        this.chatHistory = [];
        this.createdAt = new Date();
        this.isActive = true;
    }

    addStudent(studentId, studentName) {
        if (this.students.has(studentId)) {
            throw new Error('Student already exists in room');
        }

        // Check if student was previously kicked
        const wasKicked = Array.from(this.students.values())
            .some(student => student.name === studentName && student.isKicked);

        if (wasKicked) {
            throw new Error('Student was kicked from this room');
        }

        this.students.set(studentId, {
            name: studentName,
            joinTime: new Date(),
            isKicked: false
        });
    }

    removeStudent(studentId) {
        return this.students.delete(studentId);
    }

    kickStudent(studentId) {
        const student = this.students.get(studentId);
        if (student) {
            student.isKicked = true;
            return true;
        }
        return false;
    }

    getActiveStudents() {
        return new Map(
            Array.from(this.students.entries())
                .filter(([_, student]) => !student.isKicked)
        );
    }

    setTeacher(teacherId) {
        this.teacherId = teacherId;
    }

    addQuestion(question) {
        const optionCount = {};
        question.options.forEach(opt => {
            optionCount[opt.id] = 0;
        });
        const questionData = {
            id: uuidv4(),
            question: question.question,
            options: question.options,
            optionCount,
            correctAnswer: question.correctAnswer,
            askedAt: new Date(),
            responses: new Map(), // studentId -> selectedOption
            isActive: true,
            createdAt: new Date()
        };
        this.questions.push(questionData);
        this.currentQuestion = questionData;
        return questionData;
    }

    addResponse(questionId, studentId, selectedOption) {
        const question = this.questions.find(q => q.id === questionId);
        if (!question || !question.isActive) {
            throw new Error('Question not found or not active');
        }
        question.optionCount[selectedOption]++;
        question.responses.set(studentId, selectedOption);
        return this.getQuestionStats(questionId);
    }

    getQuestionStats(questionId) {
        const question = this.questions.find(q => q.id === questionId);
        if (!question) return null;

        const totalResponses = question.responses.size;
        const optionCounts = question.optionCount;

        // question.options.forEach(option => {
        //     optionCounts[option.text] = 0;
        // });

        // Array.from(question.responses.values()).forEach(response => {
        //     if (optionCounts.hasOwnProperty(response)) {
        //         optionCounts[response]++;
        //     }
        // });

        return {
            questionId: question.id,
            question: question.question,
            totalResponses,
            totalStudents: this.getActiveStudents().size,
            optionCounts,
            responses: Array.from(question.responses.entries())
        };
    }

    endCurrentQuestion() {
        if (this.currentQuestion) {
            this.currentQuestion.isActive = false;
            this.currentQuestion = null;

            if (this.questionTimer) {
                clearTimeout(this.questionTimer);
                this.questionTimer = null;
            }
        }
    }

    addChatMessage(senderId, senderName, message, senderType) {
        const chatMessage = {
            id: uuidv4(),
            senderId,
            senderName,
            message,
            senderType, // 'teacher' or 'student'
            timestamp: new Date()
        };

        this.chatHistory.push(chatMessage);
        return chatMessage;
    }

    getAllQuestionStats() {
        return this.questions.map(question => ({
            id: question.id,
            question: question.question,
            options: question.options,
            correctAnswer: question.correctAnswer,
            askedAt: question.askedAt,
            stats: this.getQuestionStats(question.id)
        }));
    }

    getStudentCount() {
        return this.getActiveStudents().size;
    }

    isTeacherInRoom() {
        return this.teacherId !== null;
    }

    toJSON() {
        return {
            id: this.id,
            teacherName: this.teacherName,
            studentCount: this.getStudentCount(),
            questionsAsked: this.questions.length,
            createdAt: this.createdAt,
            isActive: this.isActive
        };
    }
}

module.exports = Room;