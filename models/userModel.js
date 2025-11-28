import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  // Last known location stored as GeoJSON Point type
  lastKnownLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  // Indicates if user is currently being tracked or sharing location
  isBeingTracked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Add 2dsphere index for geospatial queries on location
userSchema.index({ lastKnownLocation: '2dsphere' });

export default mongoose.model('User', userSchema);
