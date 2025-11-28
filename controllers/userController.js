import User from '../models/userModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET);
};


// Register new user (REST API)
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        lastKnownLocation: user.lastKnownLocation,
        isBeingTracked: user.isBeingTracked
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login user (REST API)
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        lastKnownLocation: user.lastKnownLocation,
        isBeingTracked: user.isBeingTracked
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user profile (protected route, REST API)
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update last known location (REST API)
export const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (latitude == null || longitude == null) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.lastKnownLocation = {
      type: 'Point',
      coordinates: [longitude, latitude]
    };
    user.isBeingTracked = true;

    await user.save();

    res.json({ message: 'Location updated', lastKnownLocation: user.lastKnownLocation });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Stop sharing location (REST API)
export const stopTracking = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isBeingTracked = false;
    await user.save();

    res.json({ message: 'Stopped tracking user' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// --- Socket.IO handler function to update location in DB and broadcast ---

export const updateUserLocationViaSocket = async (userId, locationData, io, socket) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    user.lastKnownLocation = {
      type: 'Point',
      coordinates: [locationData.longitude, locationData.latitude]
    };
    user.isBeingTracked = true;
    await user.save();

    // Broadcast new location to other clients except sender
    socket.broadcast.emit('newLocation', { userId, username: user.username, coords: locationData });
  } catch (error) {
    console.error('Error updating location via socket:', error.message);
  }
};



// Get all tracked users' locations
export const getTrackedUsers = async (req, res) => {
  const users = await User.find({ isBeingTracked: true }).select('username lastKnownLocation _id');
  res.json(users);
};
