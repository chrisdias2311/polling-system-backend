const ROOM_CONSTANTS = {
    MAX_ROOM_NAME_LENGTH: 50,
    MAX_STUDENT_NAME_LENGTH: 50,
    MAX_QUESTION_LENGTH: 500,
    MAX_OPTION_LENGTH: 200,
    MAX_CHAT_MESSAGE_LENGTH: 1000,
    MIN_OPTIONS_PER_QUESTION: 2,
    MAX_OPTIONS_PER_QUESTION: 6,
    QUESTION_TIMEOUT: 60000, // 60 seconds
    ROOM_CLEANUP_INTERVAL: 60000, // 1 minute
    ROOM_EXPIRY_TIME: 24 * 60 * 60 * 1000 // 24 hours
};

const SOCKET_EVENTS = {
    // Connection events
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',
    
    // Room events
    JOIN_AS_TEACHER: 'join-as-teacher',
    JOIN_AS_STUDENT: 'join-as-student',
    JOINED_ROOM: 'joined-room',
    TEACHER_JOINED: 'teacher-joined',
    STUDENT_JOINED: 'student-joined',
    TEACHER_LEFT: 'teacher-left',
    STUDENT_LEFT: 'student-left',
    
    // Question events
    ASK_QUESTION: 'ask-question',
    QUESTION_ASKED: 'question-asked',
    NEW_QUESTION: 'new-question',
    SUBMIT_ANSWER: 'submit-answer',
    ANSWER_SUBMITTED: 'answer-submitted',
    QUESTION_ENDED: 'question-ended',
    ANSWER_STATS_UPDATE: 'answer-stats-update',
    
    // Chat events
    SEND_MESSAGE: 'send-message',
    NEW_MESSAGE: 'new-message',
    
    // Admin events
    KICK_STUDENT: 'kick-student',
    STUDENT_KICKED: 'student-kicked',
    STUDENT_KICKED_SUCCESS: 'student-kicked-success',
    KICKED_FROM_ROOM: 'kicked-from-room',
    
    // Stats events
    GET_ROOM_STATS: 'get-room-stats',
    ROOM_STATS: 'room-stats',
    
    // Error events
    ERROR: 'error'
};

const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
};

module.exports = {
    ROOM_CONSTANTS,
    SOCKET_EVENTS,
    HTTP_STATUS
};
