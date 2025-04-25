import React from "react";
import Sidebar from "./Sidebar"; // Import the Sidebar component

const DashboardLayout = ({ children }) => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-grow ml-64 p-6 bg-gray-100">
        {children} {/* Render the child components (pages) */}
      </div>
    </div>
  );
};

export default DashboardLayout;
