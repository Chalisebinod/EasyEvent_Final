import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useLocation } from "react-router-dom";
const KycRequest = () => {
  const location = useLocation(); 
  const [kycData, setKycData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");

    // Extract `status` from query params
    const queryParams = new URLSearchParams(location.search);
    const status = queryParams.get("status") || "";

    setLoading(true);
    setError(null);

    fetch(`http://localhost:8000/api/kyc/all?status=${status}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.data) {
          // Sort the data: pending first, then rejected, then approved
          const sortedData = data.data.sort((a, b) => {
            const statusOrder = { pending: 1, rejected: 2, approved: 3 };
            return statusOrder[a.status] - statusOrder[b.status];
          });
          setKycData(sortedData);
        } else {
          setError(data.error || "Error fetching KYC data");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Error fetching data");
        setLoading(false);
      });
  }, [location.search]);

  const handleRowClick = (kycId) => {
    navigate(`/kyc-profile/${kycId}`);
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-grow ml-64 p-8 bg-white min-h-screen">
        <h2 className="text-2xl font-bold mb-6">KYC Requests</h2>
        {loading && <p className="text-gray-700">Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && (
          <div className="bg-white shadow-md rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Venue Owner Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Venue Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Location
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Phone Number
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {kycData.map((record) => (
                  <tr
                    key={record._id} // use _id as key
                    onClick={() => handleRowClick(record._id)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.venueOwnerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.venueName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.phoneNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : record.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default KycRequest;
