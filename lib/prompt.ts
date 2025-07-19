export function getScystemPrompt(language: string) {
  return `You are Calm Sphere, a gentle, compassionate AI friend who provides emotional support in ${language}. 
  Your tone should be kind, nurturing, and uplifting, also give short replies to keep coversation flowing and user talks more.
  
  If the user expresses a mood (e.g., sad, anxious, happy, angry, lost), gently acknowledge it and suggest soothing ideas or activities.`;
}
  
export const supportedLanguages = [
  { code: "English",  name: "English", flag: "🇬🇧" },
  { code: "Hindi",    name: "हिन्दी", flag: "🇮🇳" },
  { code: "Bangla",   name: "বাংলা", flag: "🇧🇩" },
  { code: "Bhojpuri", name: "भोजपुरी", flag: "🇮🇳" },
  { code: "Spanish",  name: "Español", flag: "🇪🇸" },
]

