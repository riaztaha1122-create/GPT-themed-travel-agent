import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* Chat memory */

let conversation = [
  {
    role: "system",
    content:
      "You are a helpful AI assistant that specializes in travel planning. Respond clearly and naturally like a conversational chatbot."
  }
];

/* Chat endpoint */

app.post("/chat", async (req, res) => {
  try {

    const userMessage = req.body.message;

    if (!userMessage) {
      return res.json({ reply: "Please type a message." });
    }

    conversation.push({
      role: "user",
      content: userMessage
    });

    if (conversation.length > 15) {
      conversation = [
        conversation[0],
        ...conversation.slice(-14)
      ];
    }


    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: conversation,
      temperature: 0.7,
      max_tokens: 500
    });

    let reply = completion.choices[0].message.content || "";

    // Remove 'undefined' and trim
    reply = reply.replace(/undefined/g, "").trim();

    // Normalize line breaks and spacing
    reply = reply.replace(/\r\n|\r/g, "\n"); // Normalize all line breaks to \n
    // Ensure at least one line break after headings (lines ending with ':')
    reply = reply.replace(/(^|\n)([^\n]+:)(?!\n)/g, '$1$2\n');

    // Remove excessive blank lines (more than 2)
    reply = reply.replace(/\n{3,}/g, '\n\n');

    // Remove trailing undefined or stray words
    reply = reply.replace(/undefined\s*$/g, "");

    // Remove excessive spaces
    reply = reply.replace(/ +/g, ' ');

    // Trim each line
    reply = reply.split('\n').map(line => line.trim()).join('\n');

    // Remove empty lines at start/end
    reply = reply.replace(/^\n+|\n+$/g, '');

    conversation.push({
      role: "assistant",
      content: reply
    });

    res.json({ reply });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      reply: "Sorry, something went wrong."
    });

  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});