const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Profile routes
router.post('/create', profileController.createProfile);
router.get('/me', profileController.getProfile);
router.get('/donors', profileController.getAllDonors);
router.put('/availability', profileController.updateAvailability);

module.exports = router;