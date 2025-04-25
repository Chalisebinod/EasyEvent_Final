import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaCommentAlt, FaTimes } from "react-icons/fa";
import io from "socket.io-client";

const ChatWidget = ({ partnerId, onClose }) => {
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  const token = localStorage.getItem("access_token");
  const selfId = localStorage.getItem("user_id");

  const axiosInstance = axios.create({
    baseURL: "http://localhost:8000",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  // Compute a unique room ID based on the two user IDs.
  const roomId =
    selfId && partnerId
      ? selfId < partnerId
        ? `${selfId}_${partnerId}`
        : `${partnerId}_${selfId}`
      : null;

  const socketRef = useRef(null);

  // Setup socket connection and join the room.
  useEffect(() => {
    socketRef.current = io("http://localhost:8000");
    socketRef.current.on("connect", () => {
      console.log("Connected to realtime chat via socket");
      if (roomId) {
        socketRef.current.emit("join_room", roomId);
      }
    });

    socketRef.current.on("receive_message", (message) => {
      // Optionally, add a sender label if it's not present.
      if (!message.senderLabel) {
        message.senderLabel = message.sender === selfId ? "You" : "";
      }
      setChatMessages((prev) => [...prev, message]);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [partnerId, roomId, selfId]);

  // Function to send a chat message using Axios and socket.
  const handleSendMessage = async () => {
    if (chatInput.trim() === "") return;
    const payload = {
      receiver: partnerId,
      message: chatInput,
      sender: selfId,
      room: roomId,
    };
    try {
      const { data } = await axiosInstance.post("/api/chat/send", payload);
      if (data.success) {
        // Append the new message returned from the API to the state.
        setChatMessages((prev) => [...prev, data.data]);
        // Emit the message through socket for realtime update.
        if (socketRef.current) {
          socketRef.current.emit("send_message", payload);
        }
        setChatInput("");
      } else {
        console.error("Error sending message:", data.error);
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // (Optional) Poll for messages as a fallback.
  const fetchMessages = async () => {
    try {
      const { data } = await axiosInstance.post("/api/chat/recieve", {
        partnerId: partnerId,
      });
      if (data.success) {
        setChatMessages(data.data.messages);
      } else {
        console.error("Error fetching messages:", data.error);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  useEffect(() => {
    fetchMessages();
    const intervalId = setInterval(fetchMessages, 5000);
    return () => clearInterval(intervalId);
  }, [partnerId]);

  return (
    <div className="fixed bottom-20 right-6 z-50 w-80 h-96 flex flex-col bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Chat Header */}
      <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between shadow">
        <h2 className="text-lg font-bold">Messenger</h2>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 focus:outline-none"
        >
          <FaTimes size={20} />
        </button>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
        {chatMessages.length > 0 ? (
          chatMessages.map((msg) => {
            const isMyMessage = msg.senderLabel === "You";
            return (
              <div
                key={msg._id || msg.id}
                className={`flex flex-col text-sm ${
                  isMyMessage ? "items-end" : "items-start"
                }`}
              >
                {/* Sender Label */}
                {msg.senderLabel && (
                  <span className="text-xs text-gray-400 mb-1">
                    {msg.senderLabel}
                  </span>
                )}
                {/* Message Bubble */}
                <div
                  className={`px-4 py-2 rounded-xl max-w-xs break-words shadow-sm ${
                    isMyMessage
                      ? "bg-blue-500 text-white rounded-br-none"
                      : "bg-white text-gray-800 rounded-bl-none border"
                  }`}
                >
                  {msg.message}
                </div>
                {/* Timestamp */}
                <span className="mt-1 text-xs text-gray-400">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            );
          })
        ) : (
          <p className="text-center text-gray-500">No messages yet...</p>
        )}
      </div>

      {/* Chat Input Area */}
      <div className="border-t p-3 bg-white flex items-center space-x-2">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSendMessage();
            }
          }}
          placeholder="Type a message..."
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={handleSendMessage}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatWidget;
