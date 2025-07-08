const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Blood request routes
router.post('/send', requestController.sendBloodRequest);
router.get('/sent', requestController.getSentRequests);
router.get('/received', requestController.getReceivedRequests);
router.put('/accept/:requestId', requestController.acceptRequest);
router.put('/reject/:requestId', requestController.rejectRequest);
router.put('/complete/:requestId', requestController.markDonationCompleted);

module.exports = router;