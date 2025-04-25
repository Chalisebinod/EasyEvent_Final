import React from "react";
import Navbar from "./Navbar";

function UserBookings() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <Navbar />
      <div className="bg-gray-100 min-h-screen pt-20">
        {/* Outer container (removes side spacing & centers content) */}
        <div className="max-w-screen-lg mx-auto px-4">
          
          {/* Page Title */}
          <h1 className="text-3xl font-bold mb-6 text-gray-800">
            User Bookings
          </h1>

          {/* Card-like container */}
          <div className="bg-white shadow-md rounded-lg p-6">
            
            {/* Search Bar */}
            <div className="flex items-center space-x-2 mb-6">
              <input
                type="text"
                placeholder="Search bookings..."
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition duration-300">
                Search
              </button>
            </div>

            {/* Table Container: Only this area scrolls vertically */}
            <div className="overflow-y-auto" style={{ maxHeight: "400px" }}>
              <table className="w-full table-auto">
                <thead className="bg-gray-200 text-gray-800 uppercase text-lg font-bold leading-normal">
                  <tr>
                    <th className="py-3 px-4 text-left">S.N</th>
                    <th className="py-3 px-4 text-left">Event</th>
                    <th className="py-3 px-4 text-left">Date</th>
                    <th className="py-3 px-4 text-left">Review</th>
                    <th className="py-3 px-4 text-left">Rating</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 text-sm">
                  {/* Example Row 1 */}
                  <tr className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="py-3 px-4">1</td>
                    <td className="py-3 px-4">Wedding Reception</td>
                    <td className="py-3 px-4">2025-03-15</td>
                    <td className="py-3 px-4">Great service!</td>
                    <td className="py-3 px-4">4.5/5</td>
                  </tr>
                  {/* Example Row 2 */}
                  <tr className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="py-3 px-4">2</td>
                    <td className="py-3 px-4">Birthday Party</td>
                    <td className="py-3 px-4">2025-04-10</td>
                    <td className="py-3 px-4">Fun atmosphere!</td>
                    <td className="py-3 px-4">4/5</td>
                  </tr>
                  {/* Add more rows as needed */}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserBookings;
