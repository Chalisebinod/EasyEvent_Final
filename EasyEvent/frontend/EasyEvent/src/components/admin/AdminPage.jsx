// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import DashboardLayout from "./DashboardLayout";

// const AdminPage = () => {
//   const [admins, setAdmins] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [newAdminName, setNewAdminName] = useState("");
//   const [newAdminEmail, setNewAdminEmail] = useState("");
//   const [newAdminPassword, setNewAdminPassword] = useState(""); 
//   const [isPopupOpen, setIsPopupOpen] = useState(false); // State to control popup visibility

//   useEffect(() => {
//     fetchAdmins();
//   }, []);

//   const fetchAdmins = async () => {
//     setLoading(true);
//     const token = localStorage.getItem("access_token");
//     try {
//       const response = await axios.get("http://localhost:8000/api/admins", {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       setAdmins(response.data.data);
//     } catch (error) {
//       console.error("Error fetching admins:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const removeAdmin = async (adminId) => {
//     const token = localStorage.getItem("access_token");
//     try {
//       await axios.delete(`http://localhost:8000/api/admins/${adminId}`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       fetchAdmins(); // Refresh the admin list after removal
//     } catch (error) {
//       console.error("Error removing admin:", error);
//     }
//   };

//   const createAdmin = async (e) => {
//     e.preventDefault();
//     const token = localStorage.getItem("access_token");
//     try {
//       await axios.post(
//         "http://localhost:8000/api/signup",
//         {
//           name: newAdminName,
//           email: newAdminEmail,
//           password: newAdminPassword, 
//           role: "admin", 
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );
//       fetchAdmins(); // Refresh the admin list after adding
//       setNewAdminName("");
//       setNewAdminEmail("");
//       setNewAdminPassword(""); // Reset password field
//       setIsPopupOpen(false); // Close the popup after submission
//     } catch (error) {
//       console.error("Error creating admin:", error);
//     }
//   };

//   return (
//     <div className="flex">
//       <DashboardLayout />
//       <div className="flex-grow p-6 bg-gray-100">
//         <h1 className="text-3xl font-semibold mb-6">Admin Management</h1>

//         {/* Create Admin Button */}
//         <button
//           onClick={() => setIsPopupOpen(true)}
//           className="bg-blue-500 text-white px-4 py-2 rounded-md mb-6"
//         >
//           Create Admin
//         </button>

//         {/* Overlay Popup for Create Admin Form */}
//         {isPopupOpen && (
//           <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
//             <div className="bg-white p-6 rounded-lg shadow-md w-96">
//               <div className="flex justify-between items-center">
//                 <h2 className="text-xl font-semibold">Create New Admin</h2>
//                 <button
//                   onClick={() => setIsPopupOpen(false)}
//                   className="text-gray-600 text-2xl"
//                 >
//                   &times;
//                 </button>
//               </div>
//               <form onSubmit={createAdmin} className="mt-4">
//                 <div className="mb-4">
//                   <label className="block text-gray-700">Admin Name</label>
//                   <input
//                     type="text"
//                     value={newAdminName}
//                     onChange={(e) => setNewAdminName(e.target.value)}
//                     className="px-4 py-2 w-full border rounded-md"
//                     required
//                   />
//                 </div>
//                 <div className="mb-4">
//                   <label className="block text-gray-700">Admin Email</label>
//                   <input
//                     type="email"
//                     value={newAdminEmail}
//                     onChange={(e) => setNewAdminEmail(e.target.value)}
//                     className="px-4 py-2 w-full border rounded-md"
//                     required
//                   />
//                 </div>
//                 <div className="mb-4">
//                   <label className="block text-gray-700">Admin Password</label>
//                   <input
//                     type="password"
//                     value={newAdminPassword}
//                     onChange={(e) => setNewAdminPassword(e.target.value)}
//                     className="px-4 py-2 w-full border rounded-md"
//                     required
//                   />
//                 </div>
//                 <button
//                   type="submit"
//                   className="bg-blue-500 text-white px-4 py-2 rounded-md"
//                 >
//                   Create Admin
//                 </button>
//               </form>
//             </div>
//           </div>
//         )}

//         {loading ? (
//           <p className="text-center text-lg text-gray-600">Loading...</p>
//         ) : (
//           <table className="table-auto w-full bg-white rounded-lg shadow-md overflow-hidden">
//             <thead className="bg-gray-200">
//               <tr>
//                 <th className="px-4 py-2">Name</th>
//                 <th className="px-4 py-2">Email</th>
//                 <th className="px-4 py-2">Action</th>
//               </tr>
//             </thead>
//             <tbody>
//               {admins.map((admin) => (
//                 <tr key={admin._id} className="border-b last:border-none">
//                   <td className="px-4 py-2">{admin.name}</td>
//                   <td className="px-4 py-2">{admin.email}</td>
//                   <td className="px-4 py-2">
//                     <button
//                       onClick={() => removeAdmin(admin._id)}
//                       className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
//                     >
//                       Remove Admin
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>
//     </div>
//   );
// };

// export default AdminPage;
