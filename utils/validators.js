const { body, param, validationResult } = require('express-validator');
const { ROOM_CONSTANTS } = require('./constants');

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

const questionValidation = [
    body('question')
        .trim()
        .isLength({ min: 1, max: ROOM_CONSTANTS.MAX_QUESTION_LENGTH })
        .withMessage(`Question must be between 1 and ${ROOM_CONSTANTS.MAX_QUESTION_LENGTH} characters`),
    
    body('options')
        .isArray({ min: ROOM_CONSTANTS.MIN_OPTIONS_PER_QUESTION, max: ROOM_CONSTANTS.MAX_OPTIONS_PER_QUESTION })
        .withMessage(`Must have between ${ROOM_CONSTANTS.MIN_OPTIONS_PER_QUESTION} and ${ROOM_CONSTANTS.MAX_OPTIONS_PER_QUESTION} options`),
    
    body('options.*.text')
        .trim()
        .isLength({ min: 1, max: ROOM_CONSTANTS.MAX_OPTION_LENGTH })
        .withMessage(`Option text must be between 1 and ${ROOM_CONSTANTS.MAX_OPTION_LENGTH} characters`),
    
    body('options.*.isCorrect')
        .isBoolean()
        .withMessage('isCorrect must be a boolean')
];

const chatMessageValidation = [
    body('message')
        .trim()
        .isLength({ min: 1, max: ROOM_CONSTANTS.MAX_CHAT_MESSAGE_LENGTH })
        .withMessage(`Message must be between 1 and ${ROOM_CONSTANTS.MAX_CHAT_MESSAGE_LENGTH} characters`)
];

const studentNameValidation = [
    body('studentName')
        .trim()
        .isLength({ min: 1, max: ROOM_CONSTANTS.MAX_STUDENT_NAME_LENGTH })
        .withMessage(`Student name must be between 1 and ${ROOM_CONSTANTS.MAX_STUDENT_NAME_LENGTH} characters`)
        .escape()
];

module.exports = {
    validateRequest,
    questionValidation,
    chatMessageValidation,
    studentNameValidation
};
