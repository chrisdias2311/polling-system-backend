const crypto = require('crypto');

const generateRoomId = () => {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
};

const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

const formatTimeRemaining = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${remainingSeconds}s`;
};

const calculateQuestionStats = (responses, totalStudents) => {
    const stats = {
        totalResponses: responses.length,
        totalStudents,
        responseRate: totalStudents > 0 ? (responses.length / totalStudents * 100).toFixed(1) : 0,
        optionBreakdown: {}
    };

    responses.forEach(response => {
        if (stats.optionBreakdown[response.selectedOption]) {
            stats.optionBreakdown[response.selectedOption]++;
        } else {
            stats.optionBreakdown[response.selectedOption] = 1;
        }
    });

    return stats;
};

const isValidRoomId = (roomId) => {
    return /^[A-Z0-9]{6,10}$/.test(roomId);
};

const createSuccessResponse = (data, message = 'Success') => {
    return {
        success: true,
        message,
        data
    };
};

const createErrorResponse = (message, statusCode = 500) => {
    return {
        success: false,
        message,
        statusCode
    };
};

module.exports = {
    generateRoomId,
    sanitizeInput,
    formatTimeRemaining,
    calculateQuestionStats,
    isValidRoomId,
    createSuccessResponse,
    createErrorResponse
};