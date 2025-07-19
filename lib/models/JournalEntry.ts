import mongoose from "mongoose"

const JournalEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  prompt: {
    type: String,
    default: null,
  },
  geminiComment: {
    type: String,
    default: null,
  },
  mood: {
    type: String,
    enum: ["very-sad", "sad", "neutral", "happy", "very-happy"],
  },
  tags: [
    {
      type: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.models.JournalEntry || mongoose.model("JournalEntry", JournalEntrySchema)
