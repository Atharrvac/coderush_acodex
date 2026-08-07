/**
 * Application Constants
 * Centralized configuration for maintainability
 */

module.exports = {
  // User roles - matches database enum
  ROLES: {
    ADMIN: 'admin',
    FACULTY: 'faculty',
    STUDENT: 'student'
  },

  // Attendance status options
  ATTENDANCE_STATUS: {
    PRESENT: 'present',
    ABSENT: 'absent',
    LATE: 'late',
    EXCUSED: 'excused'
  },

  // Assignment status
  ASSIGNMENT_STATUS: {
    PENDING: 'pending',
    SUBMITTED: 'submitted',
    GRADED: 'graded',
    LATE: 'late'
  },

  // Pagination defaults
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
  },

  // File upload limits
  UPLOAD: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'jpg', 'png']
  },

  // Grade scale
  GRADES: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F']
};
