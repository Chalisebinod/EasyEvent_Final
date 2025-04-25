import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import VenueSidebar from "./VenueSidebar";
import { FiImage, FiPaperclip, FiSearch } from "react-icons/fi";
import io from "socket.io-client";

// Adjust if your images are served from a different URL
const BASE_IMAGE_URL = "http://localhost:8000/";

// Helper to get full image URL for conversation images
const getImageUrl = (imagePath) => {
  if (!imagePath) return "https://via.placeholder.com/40";
  return imagePath.startsWith("http")
    ? imagePath
    : BASE_IMAGE_URL + imagePath;
};

// NEW: Helper to get full profile image URL for partner profile pictures
const getProfileImageUrl = (imagePath) => {
  if (!imagePath) return "https://via.placeholder.com/150";
  return imagePath.startsWith("http")
    ? imagePath
    : BASE_IMAGE_URL + imagePath;
};

const AllChat = () => {
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [chatInput, setChatInput] = useState("");

  // Auth / user data
  const token = localStorage.getItem("access_token");
  const currentUserId = localStorage.getItem("user_id"); // current venue owner ID

  // Socket reference
  const socketRef = useRef();

  // 1) Fetch conversation list
  const fetchConversations = async (query = "") => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/chat/conversation/?q=${encodeURIComponent(
          query
        )}`,
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

  // 2) Initial fetch of conversations
  useEffect(() => {
    fetchConversations();
  }, []);

  // 3) Debounce search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchConversations(searchQuery);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // 4) Handle conversation click
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
        // Prepare conversation details
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
          selfId < partnerId
            ? `${selfId}_${partnerId}`
            : `${partnerId}_${selfId}`;
        if (socketRef.current) {
          socketRef.current.emit("join_room", roomId);
        }
      }
    } catch (err) {
      console.error("Error fetching conversation details:", err);
    }
  };

  // 5) Setup socket connection
  useEffect(() => {
    socketRef.current = io("http://localhost:8000");
    socketRef.current.on("connect", () => {
      console.log("Connected to socket server");
      // Join personal room so that we receive messages addressed to this user
      if (currentUserId) {
        socketRef.current.emit("join_room", currentUserId);
      }
    });

    // Listen for new messages
    socketRef.current.on("receive_message", (data) => {
      console.log("Received message:", data);

      // If the message is between the current user and the open partner, append it
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

      // Update conversation list with the latest message
      setConversations((prevConversations) =>
        prevConversations.map((conv) => {
          if (
            conv.partnerId === data.sender ||
            conv.partnerId === data.receiver
          ) {
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

  // 6) Continuously fetch messages for the selected conversation every 5 seconds
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

    // Fetch messages initially and every 5 seconds
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);

    return () => clearInterval(interval);
  }, [selectedConversation, token]);

  // 7) Send message
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

    // Show it immediately in the UI
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

    // Send to server
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

    // Emit to socket
    if (socketRef.current) {
      socketRef.current.emit("send_message", payload);
    }

    setChatInput("");
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Left Sidebar */}
      <VenueSidebar />

      {/* Main Container (Conversations + Chat) */}
      <div className="flex-1 flex flex-col md:flex-row m-4 bg-white shadow-md rounded-lg overflow-hidden">
        {/* Conversation List Panel */}
        <div className="md:w-100 border-r bg-white flex flex-col">
          {/* Panel Header */}
          <div className="px-4 py-3 bg-blue-600 text-white text-lg font-semibold">
            Conversations
          </div>
          {/* Search Box */}
          <div className="p-3 border-b">
            <div className="relative">
              <FiSearch className="absolute top-3 left-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Filtered Conversation Items */}
          <div className="flex-1 overflow-y-auto">
            {conversations
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
                    className={`w-full text-left px-4 py-3 border-b flex items-center space-x-3 hover:bg-gray-50 focus:outline-none ${
                      isActive ? "bg-blue-50" : ""
                    }`}
                  >
                    <img
                      src={getImageUrl(conv.profile_image)}
                      alt={conv.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-700">
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
              })}
            {conversations.filter((conv) =>
              conv.name.toLowerCase().includes(searchQuery.toLowerCase())
            ).length === 0 && (
              <p className="text-gray-500 p-4">
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
              <div className="bg-blue-600 text-white px-6 py-4 flex items-center space-x-4 shadow">
                <img
                  src={getProfileImageUrl(
                    selectedConversation.participants.partner.profile_image
                  )}
                  alt={selectedConversation.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white"
                />
                <h3 className="text-xl font-bold">
                  {selectedConversation.name}
                </h3>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 bg-white space-y-4">
                {selectedConversation.messages &&
                selectedConversation.messages.length > 0 ? (
                  selectedConversation.messages.map((msg) => (
                    <div
                      key={msg._id}
                      className={`flex flex-col text-sm ${
                        msg.senderLabel === "You"
                          ? "items-end"
                          : "items-start"
                      }`}
                    >
                      {/* Sender Label */}
                      <span className="text-xs text-gray-400 mb-1">
                        {msg.senderLabel}
                      </span>
                      {/* Message Bubble */}
                      <div
                        className={`px-4 py-2 rounded-xl max-w-lg break-words shadow-sm ${
                          msg.senderLabel === "You"
                            ? "bg-blue-500 text-white rounded-br-none"
                            : "bg-white text-gray-800 rounded-bl-none"
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
                  ))
                ) : (
                  <p className="text-center text-gray-500 mt-8">
                    No messages yet...
                  </p>
                )}
              </div>

              {/* Chat Input */}
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
                <button className="text-gray-600 hover:text-gray-800">
                  <FiImage size={20} />
                </button>
                <button className="text-gray-600 hover:text-gray-800">
                  <FiPaperclip size={20} />
                </button>
                <button
                  onClick={handleSendMessage}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            // If no conversation is selected
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

export default AllChat;
