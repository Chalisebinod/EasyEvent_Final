import React, { useState, useEffect, useRef } from "react";
import { FiSearch } from "react-icons/fi";
import io from "socket.io-client";
import Navbar from "../Navbar";

const BASE_IMAGE_URL = "http://localhost:8000/";

// Helper to get full profile image URL for partner profile pictures
const getProfileImageUrl = (imagePath) => {
  if (!imagePath) return "https://via.placeholder.com/150";
  return imagePath.startsWith("http")
    ? imagePath
    : BASE_IMAGE_URL + imagePath;
};

const UserChat = () => {
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [chatInput, setChatInput] = useState("");

  // Auth / user data
  const token = localStorage.getItem("access_token");
  const currentUserId = localStorage.getItem("user_id");

  // Socket reference
  const socketRef = useRef();

  // Fetch conversation list
  const fetchConversations = async (query = "") => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/chat/conversation/?q=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success) {
        setConversations(data.data);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
  };

  // Initial fetch of conversations
  useEffect(() => {
    fetchConversations();
  }, []);

  // Debounce search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchConversations(searchQuery);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Handle conversation click
  const handleUserClick = async (conversation) => {
    try {
      const response = await fetch("http://localhost:8000/api/chat/recieve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ partnerId: conversation.partnerId }),
      });
      const data = await response.json();
      if (data.success) {
        const conv = {
          ...data.data,
          name: data.data.participants.partner.name,
          profile_image: data.data.participants.partner.profile_image,
        };
        setSelectedConversation(conv);

        // Join the conversation-specific room
        const selfId = conv.participants.self._id;
        const partnerId = conv.participants.partner._id;
        const roomId =
          selfId < partnerId ? `${selfId}_${partnerId}` : `${partnerId}_${selfId}`;
        if (socketRef.current) {
          socketRef.current.emit("join_room", roomId);
        }
      }
    } catch (err) {
      console.error("Error fetching conversation details:", err);
    }
  };

  // Setup socket connection
  useEffect(() => {
    socketRef.current = io("http://localhost:8000");
    socketRef.current.on("connect", () => {
      console.log("Connected to socket server");
      if (currentUserId) {
        socketRef.current.emit("join_room", currentUserId);
      }
    });

    // Listen for new messages
    socketRef.current.on("receive_message", (data) => {
      setSelectedConversation((prev) => {
        if (prev && prev.participants) {
          const selfId = prev.participants.self._id;
          const partnerId = prev.participants.partner._id;
          if (
            (data.sender === selfId && data.receiver === partnerId) ||
            (data.sender === partnerId && data.receiver === selfId)
          ) {
            return { ...prev, messages: [...(prev.messages || []), data] };
          }
        }
        return prev;
      });

      setConversations((prevConversations) =>
        prevConversations.map((conv) => {
          if (conv.partnerId === data.sender || conv.partnerId === data.receiver) {
            return {
              ...conv,
              lastMessage: data.message,
              lastMessageTime: data.createdAt,
            };
          }
          return conv;
        })
      );
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [currentUserId]);

  // Fetch messages for the selected conversation
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation) return;
      try {
        const response = await fetch("http://localhost:8000/api/chat/recieve", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            partnerId: selectedConversation.participants.partner._id,
          }),
        });
        const data = await response.json();
        if (data.success) {
          setSelectedConversation((prev) => ({
            ...prev,
            messages: data.data.messages,
          }));
        }
      } catch (err) {
        console.error("Error fetching conversation messages:", err);
      }
    };

    fetchMessages();
  }, [selectedConversation, token]);

  // Send message
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedConversation) return;
    const selfId = selectedConversation.participants.self._id;
    const partnerId = selectedConversation.participants.partner._id;
    const roomId =
      selfId < partnerId ? `${selfId}_${partnerId}` : `${partnerId}_${selfId}`;

    const payload = {
      receiver: partnerId,
      message: chatInput,
      sender: selfId,
      room: roomId,
    };

    const newMsg = {
      _id: Date.now(),
      message: chatInput,
      createdAt: new Date().toISOString(),
      sender: selfId,
      senderLabel: "You",
      room: roomId,
    };

    setSelectedConversation((prev) => ({
      ...prev,
      messages: [...(prev.messages || []), newMsg],
    }));

    try {
      const response = await fetch("http://localhost:8000/api/chat/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!data.success) {
        console.error("Failed to send message:", data.message);
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }

    if (socketRef.current) {
      socketRef.current.emit("send_message", payload);
    }

    setChatInput("");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Conversations & Chat Panel */}
      <div className="flex-1 flex flex-col md:flex-row mt-1 bg-white shadow-lg rounded-lg overflow-hidden mx-4 mb-4">
        {/* Conversation List Panel */}
        <div className="md:w-72 border-r bg-white flex flex-col">
          {/* Panel Header */}
          <div className="px-6 py-4 bg-slate-900 text-white text-lg font-bold">
            Conversations
          </div>
          {/* Search Box */}
          <div className="p-4 border-b">
            <div className="relative">
              <FiSearch className="absolute top-3 left-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          {/* Conversation Items */}
          <div className="flex-1 overflow-y-auto">
            {conversations
              .filter((conv) =>
                conv.name.toLowerCase().includes(searchQuery.toLowerCase())
              ).length > 0 ? (
              conversations
                .filter((conv) =>
                  conv.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((conv) => {
                  const isActive =
                    selectedConversation &&
                    selectedConversation.participants &&
                    selectedConversation.participants.partner._id ===
                      conv.partnerId;
                  return (
                    <button
                      key={conv.partnerId}
                      onClick={() => handleUserClick(conv)}
                      className={`w-full text-left px-6 py-4 border-b flex items-center space-x-4 hover:bg-gray-50 focus:outline-none transition-colors ${
                        isActive ? "bg-green-50" : ""
                      }`}
                    >
                      <img
                        src={getProfileImageUrl(conv.profile_image)}
                        alt={conv.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-800">
                          {conv.name}
                        </div>
                        {conv.lastMessage && (
                          <div className="text-xs text-gray-500 truncate">
                            {conv.lastMessage}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
            ) : (
              <p className="text-gray-500 p-6">
                Person with this name not found.
              </p>
            )}
          </div>
        </div>

        {/* Chat Panel */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center space-x-4 shadow">
                <img
                  src={getProfileImageUrl(
                    selectedConversation.participants.partner.profile_image
                  )}
                  alt={selectedConversation.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <h3 className="text-xl font-bold">
                  {selectedConversation.name}
                </h3>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-4">
                {selectedConversation.messages &&
                selectedConversation.messages.length > 0 ? (
                  selectedConversation.messages.map((msg) => (
                    <div
                      key={msg._id}
                      className={`flex flex-col text-sm ${
                        msg.senderLabel === "You" ? "items-end" : "items-start"
                      }`}
                    >
                      <span className="text-xs text-gray-400 mb-1">
                        {msg.senderLabel}
                      </span>
                      <div
                        className={`px-4 py-2 rounded-xl max-w-lg break-words shadow-sm ${
                          msg.senderLabel === "You"
                            ? "bg-slate-900 text-white rounded-br-none"
                            : "bg-white text-gray-800 rounded-bl-none"
                        }`}
                      >
                        {msg.message}
                      </div>
                      <span className="mt-1 text-xs text-gray-400">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 mt-8">
                    No messages yet...
                  </p>
                )}
              </div>

              {/* Chat Input */}
              <div className="border-t p-4 bg-white flex items-center space-x-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendMessage();
                  }}
                  placeholder="Type a message..."
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-bg-slate-900"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition-colors"
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <h2 className="text-xl text-gray-500 font-semibold">
                Select a conversation to start chatting.
              </h2>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserChat;
