import express from 'express';
import { register, login, getProfile, updateLocation, stopTracking, getTrackedUsers, logout } from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', authMiddleware, getProfile);

// Location update routes
router.post('/location', authMiddleware, updateLocation);
router.post('/stop-tracking', authMiddleware, stopTracking);
router.get('/tracked-users', getTrackedUsers);
router.post('/logout', authMiddleware, logout)

export default router;