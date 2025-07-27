import User from "@/lib/models/User";

const DAILY_CREDIT_LIMIT = 20000;

export async function checkAndUpdateCredits(userEmail: string, inputTokens: number, outputTokens: number) {
  const user = await User.findOne({ email: userEmail });
  if (!user) {
    throw new Error("User not found");
  }

  const today = new Date().toISOString().split('T')[0];

  if (user.lastApiRequestDate !== today) {
    user.dailyCreditsUsed = 0;
    user.lastApiRequestDate = today;
  }

  const creditsToUse = (inputTokens * 1) + (outputTokens * 5);

  if (user.dailyCreditsUsed + creditsToUse > DAILY_CREDIT_LIMIT) {
    await user.save(); 
    throw new Error("You have exceeded your daily credit limit. Please try again tomorrow.");
  }

  user.dailyCreditsUsed += creditsToUse;
  await user.save();

  return { 
    remainingCredits: DAILY_CREDIT_LIMIT - user.dailyCreditsUsed,
    limit: DAILY_CREDIT_LIMIT
  };
}