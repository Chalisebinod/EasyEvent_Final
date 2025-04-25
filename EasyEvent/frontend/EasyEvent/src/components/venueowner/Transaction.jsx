import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import VenueSidebar from "./VenueSidebar";
import { toast, ToastContainer } from "react-toastify";

function EnhancedTransactions() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const accessToken = localStorage.getItem("access_token");
  const [summaryStats, setSummaryStats] = useState({
    totalExpected: 0,
    totalReceived: 0,
    totalRefunded: 0,
    remainingAmount: 0,
    totalTransactions: 0,
    pendingTransactions: 0,
    completedTransactions: 0,
    refundedTransactions: 0,
  });

  // Filters and Search
  const [filters, setFilters] = useState({
    status: "",
    userName: "",
    dateRange: { start: null, end: null },
  });

  // Function to fetch payments and update stats
  const fetchPayments = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/auth/payment/getpayments",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const paymentsData = response.data.payments;
      console.log("payments", paymentsData);
      setPayments(paymentsData);

      // Calculate summary statistics using MongoDB data
      const stats = paymentsData.reduce(
        (acc, payment) => {
          acc.totalTransactions++;
          // Use expected_amount if available; fallback to payment.amount
          const expected = payment.expected_amount || payment.amount;
          acc.totalExpected += expected;

          // Handle receiving amounts for Completed and Partially Paid payments.
          if (
            payment.payment_status === "Completed" ||
            payment.payment_status === "Partially Paid"
          ) {
            // Use cumulative_paid if available; fallback to payment.amount
            const received = payment.cumulative_paid || payment.amount;
            acc.totalReceived += received;
            if (payment.payment_status === "Completed") {
              acc.completedTransactions++;
            } else {
              acc.pendingTransactions++;
            }
          } else if (payment.payment_status === "Pending") {
            acc.pendingTransactions++;
          }

          // Check if there is a refund amount regardless of payment_status.
          if (payment.refund_amount && payment.refund_amount > 0) {
            acc.totalRefunded += payment.refund_amount;
            acc.refundedTransactions++;
            // Adjust expected amount when refund exists.
            acc.totalExpected -= payment.refund_amount;
          }

          return acc;
        },
        {
          totalExpected: 0,
          totalReceived: 0,
          totalRefunded: 0,
          totalTransactions: 0,
          pendingTransactions: 0,
          completedTransactions: 0,
          refundedTransactions: 0,
        }
      );
      stats.remainingAmount = stats.totalExpected - stats.totalReceived;
      setSummaryStats(stats);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to fetch payment data");
    }
  };

  // Poll for payments data every 5 seconds
  useEffect(() => {
    fetchPayments();
    const interval = setInterval(() => {
      fetchPayments();
    }, 5000);
    return () => clearInterval(interval);
  }, [accessToken]);

  // Filter Payments whenever payments or filters change
  useEffect(() => {
    let result = payments;

    // Filter by status
    if (filters.status) {
      result = result.filter(
        (payment) => payment.payment_status === filters.status
      );
    }

    // Filter by user name
    if (filters.userName) {
      result = result.filter((payment) =>
        payment.user?.name
          .toLowerCase()
          .includes(filters.userName.toLowerCase())
      );
    }

    // Filter by date range
    if (filters.dateRange.start && filters.dateRange.end) {
      result = result.filter((payment) => {
        const paymentDate = new Date(payment.created_at);
        return (
          paymentDate >= new Date(filters.dateRange.start) &&
          paymentDate <= new Date(filters.dateRange.end)
        );
      });
    }

    setFilteredPayments(result);
  }, [payments, filters]);

  // Refund handler with confirmation and data refresh after refund
  const handleRefund = async (pidx, amount) => {
    if (!window.confirm(`Are you sure you want to refund Rs. ${amount}?`)) {
      return;
    }
    try {
      const response = await axios.post(
        "http://localhost:8000/api/auth/payment/refund",
        {
          pidx, // Transaction ID from the Payment record
          refund_amount: amount, // The refund amount
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (response.data?.success) {
        toast.success(`Refunded Rs. ${response.data.refunded_amount}`);
        // Re-fetch payments to update the UI
        fetchPayments();
      } else {
        toast.error("Refund initiation failed");
      }
    } catch (error) {
      toast.error(
        "Refund failed: " + (error.response?.data?.message || error.message)
      );
    }
  };

  // User Aggregated Stats using useMemo to avoid unnecessary recalculations
  const userAggregatedStats = useMemo(() => {
    const userStats = {};
    payments.forEach((payment) => {
      if (!payment.user) return;
      const userId = payment.user._id;
      if (!userStats[userId]) {
        userStats[userId] = {
          name: payment.user.name,
          email: payment.user.email,
          totalTransactions: 0,
          totalAmount: 0,
          refundedAmount: 0,
          completedTransactions: 0,
          refundedTransactions: 0,
        };
      }
      const stats = userStats[userId];
      stats.totalTransactions++;
      stats.totalAmount += payment.amount;
      if (payment.payment_status === "Completed") {
        stats.completedTransactions++;
      } else if (payment.payment_status === "Refunded") {
        stats.refundedAmount += payment.amount;
        stats.refundedTransactions++;
      }
    });
    return Object.values(userStats);
  }, [payments]);

  return (
    <div className="flex min-h-screen bg-white">
      <VenueSidebar />
      <ToastContainer />
      <div className="flex-1 p-6 md:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Financial Overview
        </h1>

        {/* Summary Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-indigo-600 text-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Total Expected</h3>
            <p className="text-3xl font-bold">
              Rs. {summaryStats.totalExpected.toFixed(2)}
            </p>
            <p className="text-sm mt-1">Across all transactions</p>
          </div>
          <div className="bg-green-600 text-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Total Received</h3>
            <p className="text-3xl font-bold">
              Rs. {summaryStats.totalReceived.toFixed(2)}
            </p>
            <p className="text-sm mt-1">
              {summaryStats.completedTransactions} completed
            </p>
          </div>
          <div className="bg-red-600 text-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Total Refunded</h3>
            <p className="text-3xl font-bold">
              Rs. {summaryStats.totalRefunded.toFixed(2)}
            </p>
            <p className="text-sm mt-1">
              {summaryStats.refundedTransactions} refunded
            </p>
          </div>
          <div className="bg-blue-600 text-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Remaining Amount</h3>
            <p className="text-3xl font-bold">
              Rs. {summaryStats.remainingAmount.toFixed(2)}
            </p>
            <p className="text-sm mt-1">
              {summaryStats.pendingTransactions} pending
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              className="px-3 py-2 border rounded"
            >
              <option value="">All Status</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Refunded">Refunded</option>
              <option value="Partially Paid">Partially Paid</option>
            </select>
            <input
              type="text"
              placeholder="Search by User Name"
              value={filters.userName}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, userName: e.target.value }))
              }
              className="px-3 py-2 border rounded"
            />
            <div className="flex space-x-2">
              <input
                type="date"
                value={filters.dateRange.start || ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, start: e.target.value },
                  }))
                }
                className="px-3 py-2 border rounded flex-1"
              />
              <input
                type="date"
                value={filters.dateRange.end || ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, end: e.target.value },
                  }))
                }
                className="px-3 py-2 border rounded flex-1"
              />
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto mb-8">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Transaction History
            </h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Venue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(payment.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {payment.user?.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {payment.user?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {payment.booking?.venue}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-sm ${
                        payment.payment_status === "Refunded"
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      Rs. {payment.amount.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs ${
                        payment.payment_status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : payment.payment_status === "Refunded"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {payment.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {payment.payment_status === "Completed" && (
                      <button
                        onClick={() =>
                          handleRefund(payment.transaction_id, payment.amount)
                        }
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Refund
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* User Aggregated Stats */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              User Financial Summary
            </h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Transactions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Refunded Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {userAggregatedStats.map((userStat) => (
                <tr key={userStat.email} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {userStat.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {userStat.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {userStat.totalTransactions}{" "}
                    <span className="text-xs text-gray-400 ml-2">
                      (Completed: {userStat.completedTransactions}, Refunded:{" "}
                      {userStat.refundedTransactions})
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-green-600">
                    Rs. {userStat.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-red-600">
                    Rs. {userStat.refundedAmount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default EnhancedTransactions;
