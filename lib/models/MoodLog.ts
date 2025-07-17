import mongoose from "mongoose"

const MoodLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  mood: {
    type: String,
    enum: ["very-sad", "sad", "neutral", "happy", "very-happy"],
    required: true,
  },
  notes: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.models.MoodLog || mongoose.model("MoodLog", MoodLogSchema)
