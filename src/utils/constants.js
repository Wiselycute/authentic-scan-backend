const VERIFICATION_STATUS = Object.freeze({
  LIKELY_AUTHENTIC: 'likely_authentic',
  SUSPICIOUS: 'suspicious',
  REVIEW_REQUIRED: 'review_required',
  UNVERIFIED: 'unverified',
});

const USER_ROLES = Object.freeze({
  USER: 'user',
  ADMIN: 'admin',
});

module.exports = { VERIFICATION_STATUS, USER_ROLES };
