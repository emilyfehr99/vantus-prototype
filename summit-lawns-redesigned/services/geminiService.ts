import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

// Initialize the client only if the key is available to avoid runtime crashes on init
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const sendMessageToAssistant = async (
  message: string,
  history: { role: 'user' | 'model'; text: string }[]
): Promise<string> => {
  if (!ai) {
    return "I'm sorry, my AI connection is currently unavailable. Please call our office directly at (402) 913-0999 for assistance.";
  }

  try {
    const model = 'gemini-2.5-flash';
    
    // Construct prompt with context
    const systemInstruction = `You are "Summit Bot", a helpful and friendly virtual assistant for Summit Lawns Lincoln. 
    
    CORE VALUES (Must Emphasize):
    1. FREEDOM FROM CONTRACTS: "We don't do contracts. We earn your business on every visit."
    2. IRON-CLAD GUARANTEE: 100% Money Back, Risk-Free. "If our work is not excellent we will re-do the item in question for FREE. If you are still not happy, you will not owe us a single penny."
    3. EXPERT LAWN CARE: "Never feel embarrassed about your lawn again. You're gonna love the view."
    4. CONVENIENCE: Skip the check—pay with Visa, Mastercard, or Discover.
    5. EFFICIENCY: Timely communication.

    Services Offered:
    - Lawn Fertilization & Weed Control
    - Lawn Aeration
    - Overseeding
    - Mosquito Control
    - Flea, Tick, And Chigger Control
    
    Company Info:
    - Owner: Ted Glaser
    - Years in Business: 10+
    - Phone: (402) 913-0999
    - Email: office@summitlawns.com
    - Location: Omaha/Lincoln
    - Hours: Mon - Fri, 8:00 am - 5:00 pm
    - Stats: 4.8 Rating, 100% Satisfaction, 75,000+ Services/Year.
    
    Service Zip Codes: 68102, 68104, 68105, 68106, 68107, 68108, 68110, 68111, 68112, 68114, 68116, 68118, 68122, 68124.

    Tone: Confident, Neighborly, Professional, and Reassuring.
    If asked for pricing, encourage them to use the "Get a Quote" form for a custom estimate based on their lawn size.`;

    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: systemInstruction,
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    const result = await chat.sendMessage({ message: message });
    return result.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having a little trouble thinking right now. Please try again in a moment or contact our office at (402) 913-0999!";
  }
};