import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bar, Pie, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import VenueSidebar from "./VenueSidebar";
import { FaUsers, FaBookmark, FaWarehouse, FaMoneyBillWave } from "react-icons/fa";

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const VenueOwnerDashboard = () => {
  // State for KYC verification and stats
  const [verified, setVerified] = useState(null); // null: not yet determined, true: approved, false: not approved
  const [stats, setStats] = useState(null);
  // New state to track completion of the KYC check (for loader control)
  const [isKycChecked, setIsKycChecked] = useState(false);
  
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");
  const venueId = localStorage.getItem("venueId");

  // Check KYC status on mount
  useEffect(() => {
    axios
      .get("http://localhost:8000/api/check-kyc-status", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        console.log("KYC status response:", response.data.status);
        if (response.data.status.toLowerCase() === "approved") {
          setVerified(true);
        } else {
          setVerified(false);
        }
        // Mark KYC check as completed
        setIsKycChecked(true);
      })
      .catch((error) => {
        console.error("Error checking KYC status:", error);
        toast.error("Error verifying KYC status.");
        setVerified(false);
        // Even on error, mark KYC check as completed so that we can show the update prompt
        setIsKycChecked(true);
      });
  }, [token]);

  // Fetch venue stats once verified
  useEffect(() => {
    if (verified) {
      axios
        .post(
          "http://localhost:8000/api/stats",
          { venueId },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .then((response) => {
          setStats(response.data.stats);
        })
        .catch((error) => {
          console.error("Error fetching stats:", error);
          toast.error("Failed to load dashboard statistics");
        });
    }
  }, [verified, token, venueId]);

  // New Conditional Rendering

  // 1. While KYC check is in progress, show a loader
  if (!isKycChecked) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // 2. If KYC is not approved, show a KYC update prompt
  if (verified === false) {
    return (
      <div className="h-screen flex bg-white">
        <VenueSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="font-bold text-2xl text-orange-600 mb-4">
              KYC Verification Required
            </p>
            <p className="mb-6">
              Your KYC is not approved. Please update your KYC to access the dashboard.
            </p>
            <button
              className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 transition"
              onClick={() => navigate("/venue-KYC")}
            >
              Update KYC
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. If KYC is approved but stats are still loading, show a loader
  if (verified && !stats) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading dashboard statistics...
      </div>
    );
  }

  // Currency formatting helper
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Prepare data for the charts
  const revenueData = {
    labels: ["Received Today", "Refunded", "To Be Received"],
    datasets: [
      {
        data: [
          stats.totalReceivedToday,
          stats.totalRefundAmount,
          stats.totalAmountToBeReceived,
        ],
        backgroundColor: ["#10B981", "#EF4444", "#F59E0B"],
        borderWidth: 0,
      },
    ],
  };

  const bookingDistributionData = {
    labels: ["Total Halls", "Active Bookings"],
    datasets: [
      {
        data: [stats.hallCount, stats.bookingCount],
        backgroundColor: ["#6366F1", "#8B5CF6"],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
    },
  };

  return (
    <div className="h-screen flex bg-white">
      <VenueSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-bg-slate-900">Venue Analytics Dashboard</h2>
          <p className="text-gray-600">Overview of your venue's performance</p>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <FaUsers className="text-blue-500 text-xl" />
              </div>
              <span className="text-sm font-medium text-green-500 bg-green-50 px-2 py-1 rounded">
                Active
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-700">{stats.totalUsers}</h3>
            <p className="text-gray-600 text-sm">Total Users</p>
          </div>

          {/* Total Bookings */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-50 p-3 rounded-lg">
                <FaBookmark className="text-purple-500 text-xl" />
              </div>
              <span className="text-sm font-medium text-purple-500 bg-purple-50 px-2 py-1 rounded">
                Bookings
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-700">{stats.bookingCount}</h3>
            <p className="text-gray-600 text-sm">Total Bookings</p>
          </div>

          {/* Revenue Today */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <FaMoneyBillWave className="text-green-500 text-xl" />
              </div>
              <span className="text-sm font-medium text-green-500 bg-green-50 px-2 py-1 rounded">
                Today
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-700">
              {formatCurrency(stats.totalReceivedToday)}
            </h3>
            <p className="text-gray-600 text-sm">Revenue Today</p>
          </div>

          {/* Total Halls */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-50 p-3 rounded-lg">
                <FaWarehouse className="text-yellow-500 text-xl" />
              </div>
              <span className="text-sm font-medium text-yellow-500 bg-yellow-50 px-2 py-1 rounded">
                Halls
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-700">{stats.hallCount}</h3>
            <p className="text-gray-600 text-sm">Total Halls</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Overview Doughnut Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-bg-slate-900 mb-4">Revenue Overview</h3>
            <div className="h-80">
              <Doughnut data={revenueData} options={chartOptions} />
            </div>
          </div>

          {/* Booking Distribution Pie Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-bg-slate-900 mb-4">Booking Distribution</h3>
            <div className="h-80">
              <Pie data={bookingDistributionData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Additional Financial Summary */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-bg-slate-900 mb-4">Financial Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 mb-1">Total Revenue Today</p>
              <p className="text-xl font-bold text-green-700">
                {formatCurrency(stats.totalReceivedToday)}
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600 mb-1">Total Refunds</p>
              <p className="text-xl font-bold text-red-700">
                {formatCurrency(stats.totalRefundAmount)}
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-600 mb-1">Amount to be Received</p>
              <p className="text-xl font-bold text-yellow-700">
                {formatCurrency(stats.totalAmountToBeReceived)}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VenueOwnerDashboard;
