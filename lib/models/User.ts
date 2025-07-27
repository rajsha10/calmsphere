import mongoose from "mongoose"

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: function () {
      return !this.googleId
    },
  },
  googleId: {
    type: String,
    sparse: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  otpCode: {
    type: String,
    default: null,
  },
  otpExpiry: {
    type: Date,
    default: null,
  },
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpiry: {
    type: Date,
    default: null,
  },
  dailyCreditsUsed: {
    type: Number,
    default: 0,
  },
  lastApiRequestDate: {
    type: String,
    default: new Date().toISOString().split('T')[0],
  },
  recommendationCount: {
    type: Number,
    default: 0,
  },
  lastRecommendationDate: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

delete mongoose.models.User

export default mongoose.model("User", UserSchema)
