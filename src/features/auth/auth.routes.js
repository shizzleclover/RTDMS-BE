const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('./auth.controller');
const { registerValidator, loginValidator } = require('./auth.validator');
const { protect } = require('../../common/middleware/auth.middleware');

router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);
router.get('/me', protect, getMe);

module.exports = router;
