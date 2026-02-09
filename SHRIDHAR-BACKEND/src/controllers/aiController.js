const axios = require('axios');
const AppError = require('../utils/AppError');

/**
 * Handle AI Chat queries using OpenRouter
 * @route POST /api/v1/ai/chat
 */
exports.chatWithAI = async (req, res, next) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return next(new AppError('Please provide a message', 400));
        }

        // --- FALLBACK MODE (If API Key is missing) ---
        if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === 'your_openrouter_key_here') {
            console.warn('AI Chat: OPENROUTER_API_KEY missing. Using fallback response.');

            // Simple keyword-based fallback logic
            let fallbackReply = "I'm currently in demo mode as my brain is being upgraded! 🧠\n\nFor now, I can tell you that Reservice offers top-notch home services including:\n- 🔧 Home Repairs\n- 🧹 Deep Cleaning\n- 💄 Beauty Services\n- 🚚 Transport & Shifting\n\nPlease browse our 'Services' tab to book a professional!";

            const lowerMsg = message.toLowerCase();
            if (lowerMsg.includes('price') || lowerMsg.includes('cost')) {
                fallbackReply = "Our pricing is very competitive! \n- Cleaning starts at ₹499\n- AC Service at ₹599\n- Haircuts at ₹299\n\nCheck the specific service page for exact rates.";
            } else if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
                fallbackReply = "Hello there! 👋 How can I help you with your home service needs today?";
            } else if (lowerMsg.includes('contact') || lowerMsg.includes('support')) {
                fallbackReply = "You can reach our support team at support@reservice.com or call us at +91 98765 43210.";
            }

            // Simulate network delay for realism
            await new Promise(resolve => setTimeout(resolve, 1000));

            return res.status(200).json({
                status: 'success',
                data: { reply: fallbackReply }
            });
        }

        const systemPrompt = `You are the Reservice AI Assistant, a professional and helpful expert on home services in India. 
        Reservice offers:
        - Home Repairs: Plumbing, Electrical, AC Repair, Carpentry.
        - Cleaning: Deep House Cleaning, Sofa/Carpet Cleaning, Kitchen Cleaning.
        - Transport: Packers & Movers, Local shifting, Vehicle transport , Cab booking.
        - Beauty: Salon at home, Massage for men/women.
        - Appliances: Washing Machine, Refrigerator, Microwave repair.

        Guidelines:
        - Be polite, concise, and helpful.
        - Use Indian Rupee (₹) for any price mentions.
        - If a user asks for pricing, give a range based on common industry standards in India (e.g., Deep cleaning starts at ₹1499, AC service at ₹499).
        - Always encourage users to book through the Reservice app for guaranteed quality.
        - If you don't know the answer, politely suggest they contact Reservice support.
        - Keep responses short and formatted for a mobile chat interface.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            ...(history || []).map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text
            })),
            { role: 'user', content: message }
        ];

        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'openrouter/free',
            messages: messages,
            temperature: 0.7,
            max_tokens: 500
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://reservice.com', // Replace with your site URL
                'X-Title': 'Reservice AI'
            }
        });

        const reply = response.data.choices[0].message.content;

        res.status(200).json({
            status: 'success',
            data: {
                reply
            }
        });
    } catch (error) {
        console.error('AI Chat Error:', error.response?.data || error.message);
        // Graceful error fallback
        res.status(200).json({
            status: 'success',
            data: {
                reply: "I'm having a bit of trouble connecting to the cloud right now. 🌧️\n\nPlease try again in a moment, or browse our services manually."
            }
        });
    }
};
