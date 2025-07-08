const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Authentication routes
router.post('/register', authController.register);
router.post('/verify', authController.verify);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.get('/validate-token/:token', authController.validateToken);
router.post('/reset-password/:token', authController.resetPassword);
module.exports = router;