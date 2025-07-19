import mongoose, { Schema, models } from "mongoose"

const MessageSchema = new Schema({
  userId: { type: String, required: true, index: true },
  sender: { type: String, enum: ["user", "bot"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
  // Optional: Add metadata for better searching
  language: { type: String, default: "English" },
  // Optional: Add emotional context detection
  emotionalTone: { 
    type: String, 
    enum: ["positive", "negative", "neutral", "anxious", "sad", "happy", "excited", "calm"],
    default: "neutral" 
  },
  // Optional: Add topic tags for better categorization
  topics: [{ type: String }],
}, {
  timestamps: true // This adds createdAt and updatedAt automatically
})

// Add compound index for efficient querying
MessageSchema.index({ userId: 1, timestamp: -1 })

// Add text search index for content searching
MessageSchema.index({ content: "text" })

// Static methods for common queries
MessageSchema.statics = {
  // Find messages by user in date range
  async findByUserInDateRange(userId: string, startDate: Date, endDate: Date) {
    return this.find({
      userId,
      timestamp: { $gte: startDate, $lte: endDate }
    }).sort({ timestamp: 1 })
  },

  // Search messages by content
  async searchByContent(userId: string, searchText: string, limit: number = 20) {
    return this.find({
      userId,
      $text: { $search: searchText }
    })
    .sort({ timestamp: -1 })
    .limit(limit)
  },

  // Get conversation summary
  async getConversationSummary(userId: string, days: number = 7) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const messages = await this.find({
      userId,
      timestamp: { $gte: startDate }
    }).sort({ timestamp: 1 })

    const userMessages = messages.filter((msg: any) => msg.sender === 'user')
    const botMessages = messages.filter((msg: any) => msg.sender === 'bot')

    return {
      totalMessages: messages.length,
      userMessages: userMessages.length,
      botMessages: botMessages.length,
      dateRange: {
        start: startDate,
        end: new Date()
      },
      firstMessage: messages[0],
      lastMessage: messages[messages.length - 1]
    }
  },

  // Find messages by emotional tone
  async findByEmotionalTone(userId: string, tone: string, limit: number = 10) {
    return this.find({
      userId,
      emotionalTone: tone
    })
    .sort({ timestamp: -1 })
    .limit(limit)
  }
}

const Message = models.Message || mongoose.model("Message", MessageSchema)
export default Message