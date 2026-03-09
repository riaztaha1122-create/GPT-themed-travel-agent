import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";

/* Mountain and nature travel backgrounds */
const images = [
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470", // mountain hiking
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b", // alpine mountains
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee", // valley mountains
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4", // snowy peaks
  "https://images.unsplash.com/photo-1470770841072-f978cf4d019e", // mountain lake
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e", // scenic coast
  "https://images.unsplash.com/photo-1500534623283-312aade485b7"  // mountain sunrise
];

function App() {

  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [typing, setTyping] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);

  const chatEndRef = useRef(null);

  /* Background slideshow */
  useEffect(() => {

    const interval = setInterval(() => {
      setBgIndex(prev => (prev + 1) % images.length);
    }, 6000);

    return () => clearInterval(interval);

  }, []);

  /* Auto scroll */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  /* Word-by-word streaming */
  const streamResponse = (text) => {

    const words = text.split(" ");
    let index = 0;

    // create empty bot message
    setChat(prev => [...prev, { sender: "bot", text: "" }]);

    const interval = setInterval(() => {

      if (index >= words.length) {
        clearInterval(interval);
        return;
      }

      setChat(prev => {

        const updated = [...prev];
        const last = updated.length - 1;

        updated[last] = {
          ...updated[last],
          text: updated[last].text + words[index] + " "
        };

        return updated;

      });

      index++;

    }, 45);

  };

  const sendMessage = async () => {

    if (!message.trim()) return;

    const userMessage = message;

    setChat(prev => [...prev, { sender: "user", text: userMessage }]);

    setMessage("");
    setTyping(true);

    try {

      const response = await axios.post(
        "https://gpt-themed-travel-agent-m1bv.vercel.app/chat",
        { message: userMessage }
      );

      setTyping(false);

      streamResponse(response.data.reply);

    } catch (error) {

      setTyping(false);

      setChat(prev => [
        ...prev,
        { sender: "bot", text: "Something went wrong." }
      ]);

    }

  };

  return (

    <div
      className="app"
      style={{
        backgroundImage: `url(${images[bgIndex]})`
      }}
    >

      <div className="overlay"></div>

      <div className="chat-container">

        <h1 className="title">AI Travel Agent ✈️</h1>

        <div className="chat-box">

          {chat.map((msg, index) => {
            // Render bot messages with line breaks and basic markdown
            if (msg.sender === "bot") {

              let formatted = msg.text
                .replace(/\n/g, "<br />")
                .replace(/([^<br />]+:)(<br \/>|$)/g, "<strong>$1</strong><br />");

              return (
                <div
                  key={index}
                  className="message bot"
                  dangerouslySetInnerHTML={{ __html: formatted }}
                />
              );

            } else {

              return (
                <div
                  key={index}
                  className="message user"
                >
                  {msg.text}
                </div>
              );

            }
          })}

          {typing && (
            <div className="message bot typing">
              Agent is typing...
            </div>
          )}

          <div ref={chatEndRef}></div>

        </div>

        <div className="input-area">

          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
            placeholder="Ask about your next adventure..."
          />

          <button onClick={sendMessage}>
            Send
          </button>

        </div>

      </div>

    </div>

  );
}

export default App;