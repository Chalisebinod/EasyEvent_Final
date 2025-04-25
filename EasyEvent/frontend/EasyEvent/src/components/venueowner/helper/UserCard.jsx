import React from 'react';

const UserCard = ({ profileImage, name, lastMessage, lastMessageTime, onClick }) => {
  return (
    <div onClick={onClick} className="flex items-center p-4 border-b hover:bg-gray-100 cursor-pointer">
      <img 
        src={profileImage || 'https://via.placeholder.com/40'} 
        alt={name} 
        className="w-12 h-12 rounded-full object-cover" 
      />
      <div className="ml-4 flex-1">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">{name}</h3>
          {lastMessageTime && (
            <span className="text-xs text-gray-500">
              {new Date(lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 truncate">{lastMessage}</p>
      </div>
    </div>
  );
};

export default UserCard;
