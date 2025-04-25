import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Calendar,
  Clock,
  Users,
  Home,
  FileText,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Activity,
  DollarSign,
  CheckCircle,
  MoreHorizontal,
  Bell,
  Search,
  Heart,
  List,
  Box,
  Layers,
} from "lucide-react";
import Sidebar from "./Sidebar";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalVenues: 0,
    totalVenueOwners: 0,
    totalUsers: 0,
    totalBookings: 0,
    pendingKyc: 0,
    totalHalls: 0,
    totalRequests: 0,
    totalPaymentForDay: 0,
    totalRevenueOverall: 0,
    averageBookingValue: "0.00",
    bookingTypes: {},
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const accessToken = localStorage.getItem("access_token")
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:8000/api/stats", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const data = await response.json();
        setStats(data.insights);
        setError(null);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Transform booking types for pie chart
  const transformBookingTypes = () => {
    const types = stats.bookingTypes || {};
    return Object.keys(types).map((type) => ({
      name: type,
      value: types[type],
    }));
  };

  // Generate monthly revenue data
  const generateRevenueData = () => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const totalRevenue = stats.totalRevenueOverall;

    return monthNames.map((month, index) => {
      // Create a distribution that ends with the total revenue
      const factor = 0.4 + index * 0.15;
      const monthlyRevenue =
        index === 5 ? totalRevenue : Math.round(totalRevenue * factor);

      return {
        name: month,
        revenue: monthlyRevenue,
      };
    });
  };

  // User and venue growth data
  const generateGrowthData = () => {
    const months = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
    return months.map((month, index) => {
      const factor = 0.3 + index * 0.15;
      return {
        name: month,
        users: Math.round(stats.totalUsers * factor),
        venues: Math.round(stats.totalVenues * factor),
      };
    });
  };

  // Booking status data
  const bookingStatusData = [
    { name: "Confirmed", value: stats.totalBookings },
    { name: "Pending", value: stats.totalRequests },
    { name: "Cancelled", value: 0 },
  ];

  // Recent bookings
  const recentBookings = [
    {
      id: 1,
      venue: "Grand Plaza Hall",
      type: "Marriage",
      date: "Apr 2, 2025",
      amount: "$800",
      status: "Confirmed",
    },
  ];

  // Recent activities
  const recentActivities = [
    {
      id: 1,
      activity: "New booking request",
      time: "Just now",
      icon: <Calendar className="text-blue-500" />,
    },
    {
      id: 2,
      activity: "Venue 'Grand Plaza' updated details",
      time: "2 hours ago",
      icon: <Home className="text-green-500" />,
    },
    {
      id: 3,
      activity: "Payment received for booking #1001",
      time: "Yesterday",
      icon: <DollarSign className="text-purple-500" />,
    },
    {
      id: 4,
      activity: "New venue owner registered",
      time: "2 days ago",
      icon: <Users className="text-orange-500" />,
    },
  ];

  // Generate hall utilization data
  const hallUtilizationData = () => {
    return [
      { name: "Used", value: stats.totalBookings },
      { name: "Available", value: stats.totalHalls - stats.totalBookings },
    ];
  };

  // Colors for charts
  const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];
  const BOOKING_COLORS = ["#10b981", "#f59e0b", "#ef4444"];

  const StatCard = ({ title, value, icon, color, subtext }) => (
    <div className="bg-white p-5 rounded-lg shadow-lg border border-gray-100 hover:shadow-xl transition duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm text-gray-600 uppercase font-medium">
            {title}
          </h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-full ${color}`}>{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="ml-64 w-full p-6">
        {/* Header with search and notifications */}
        <header className="mb-8 flex justify-between items-center bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back! Here's your venue management overview.
            </p>
          </div>
          {/* <div className="flex items-center space-x-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="py-2 pl-10 pr-4 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <div className="relative">
              <Bell className="h-6 w-6 text-gray-600 cursor-pointer" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                2
              </span>
            </div>
          </div> */}
        </header>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="ml-3 text-gray-600">Loading dashboard data...</p>
          </div>
        ) : error ? (
          <div
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md"
            role="alert"
          >
            <div className="flex">
              <AlertTriangle className="h-6 w-6 mr-2" />
              <div>
                <p className="font-bold">Error</p>
                <p>{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Key Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
              <StatCard
                title="Venues"
                value={stats.totalVenues}
                subtext={`${stats.totalHalls} total halls available`}
                icon={<Home className="h-6 w-6 text-white" />}
                color="bg-blue-500"
              />
              <StatCard
                title="Users"
                value={stats.totalUsers}
                subtext={`${stats.totalVenueOwners} venue owners`}
                icon={<Users className="h-6 w-6 text-white" />}
                color="bg-green-500"
              />
              <StatCard
                title="Bookings"
                value={stats.totalBookings}
                subtext={`${stats.totalRequests} pending requests`}
                icon={<Calendar className="h-6 w-6 text-white" />}
                color="bg-purple-500"
              />
              <StatCard
                title="Revenue"
                value={`$${stats.totalRevenueOverall}`}
                subtext={`Avg. booking: $${stats.averageBookingValue}`}
                icon={<DollarSign className="h-6 w-6 text-white" />}
                color="bg-indigo-500"
              />
            </div>

            {/* Revenue & Growth Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100 lg:col-span-2">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-semibold text-gray-800 text-lg">
                    Revenue Trend
                  </h3>
                  <select className="bg-gray-100 border border-gray-300 text-gray-700 py-1 px-3 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Last 6 Months</option>
                    <option>This Year</option>
                    <option>Last Year</option>
                  </select>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={generateRevenueData()}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorRevenue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3b82f6"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3b82f6"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                        border: "1px solid #e5e7eb",
                      }}
                      formatter={(value) => [`$${value}`, "Revenue"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4 text-lg">
                  Booking Types
                </h3>
                {transformBookingTypes().length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={transformBookingTypes()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        paddingAngle={3}
                      >
                        {transformBookingTypes().map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, "Bookings"]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center flex-col">
                    <Calendar className="h-12 w-12 text-gray-300 mb-2" />
                    <p className="text-gray-500">
                      No booking type data available
                    </p>
                  </div>
                )}
                <div className="mt-2">
                  {transformBookingTypes().map((type, index) => (
                    <div key={index} className="flex items-center mt-2">
                      <div
                        className="h-3 w-3 rounded-full mr-2"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      ></div>
                      <span className="text-sm text-gray-600">
                        {type.name}:{" "}
                        <span className="font-medium">{type.value}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Growth, Hall Utilization, and Booking Status */}
            {/* Changed 'lg:grid-cols-3' to 'lg:grid-cols-2' to fill space */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4 text-lg">
                  Growth Metrics
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart
                    data={generateGrowthData()}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                        border: "1px solid #e5e7eb",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="venues"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div> */}

              <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4 text-lg">
                  Hall Utilization
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={hallUtilizationData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      paddingAngle={3}
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#e5e7eb" />
                    </Pie>
                    <Tooltip formatter={(value) => [value, "Halls"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="bg-green-50 p-3 rounded">
                    <div className="flex items-center">
                      <Box className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">
                        Used: {stats.totalBookings}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="flex items-center">
                      <Layers className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">
                        Available: {stats.totalHalls - stats.totalBookings}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4 text-lg">
                  Booking Status
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={bookingStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      paddingAngle={3}
                    >
                      {bookingStatusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={BOOKING_COLORS[index % BOOKING_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, "Bookings"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2">
                  {bookingStatusData.map((status, index) => (
                    <div key={index} className="flex items-center mt-2">
                      <div
                        className="h-3 w-3 rounded-full mr-2"
                        style={{
                          backgroundColor:
                            BOOKING_COLORS[index % BOOKING_COLORS.length],
                        }}
                      ></div>
                      <span className="text-sm text-gray-600">
                        {status.name}:{" "}
                        <span className="font-medium">{status.value}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Bookings and Activities */}
            {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-800 text-lg">
                    Recent Bookings
                  </h3>
                  <button className="text-blue-600 text-sm font-medium hover:text-blue-800">
                    View All
                  </button>
                </div>
                {recentBookings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b">
                          <th className="px-4 py-3 font-medium">Venue</th>
                          <th className="px-4 py-3 font-medium">Type</th>
                          <th className="px-4 py-3 font-medium">Date</th>
                          <th className="px-4 py-3 font-medium">Amount</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentBookings.map((booking) => (
                          <tr
                            key={booking.id}
                            className="border-b border-gray-100"
                          >
                            <td className="px-4 py-3">{booking.venue}</td>
                            <td className="px-4 py-3">{booking.type}</td>
                            <td className="px-4 py-3">{booking.date}</td>
                            <td className="px-4 py-3">{booking.amount}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                {booking.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No recent bookings</p>
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-800 text-lg">
                    Recent Activities
                  </h3>
                  <button className="text-blue-600 text-sm font-medium hover:text-blue-800">
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start px-2 py-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="bg-gray-100 p-2 rounded-full mr-3">
                        {activity.icon}
                      </div>
                      <div>
                        <p className="text-gray-800 font-medium">
                          {activity.activity}
                        </p>
                        <p className="text-gray-500 text-xs">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div> */}

            {/* Action Cards */}
            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 flex items-center">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <Home className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-900">Manage Venues</h3>
                  <p className="text-blue-700 text-sm mt-1">
                    Add, edit or remove venue listings
                  </p>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-100 rounded-lg p-5 flex items-center">
                <div className="bg-purple-100 p-3 rounded-full mr-4">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-purple-900">
                    User Management
                  </h3>
                  <p className="text-purple-700 text-sm mt-1">
                    View and manage user accounts
                  </p>
                </div>
              </div>

              <div className="bg-green-50 border border-green-100 rounded-lg p-5 flex items-center">
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <FileText className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-green-900">
                    Generate Reports
                  </h3>
                  <p className="text-green-700 text-sm mt-1">
                    Create detailed business reports
                  </p>
                </div>
              </div>
            </div> */}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
