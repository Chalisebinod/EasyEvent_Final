import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import MiniLogin from "./MiniLogin";

const paymentOptions = [
  { name: "Khalti", logo: "/Khalti.jpg" },
  { name: "eSewa", logo: "/esewa.png" },
  { name: "IMEpay", logo: "/ime.png" },
];

export default function ContinuePayment() {
  const [paymentUrl, setPaymentUrl] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [bookingDetails, setBookingDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const { bookingId } = useParams();
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Token + login modal state
  const [token, setToken] = useState(localStorage.getItem("access_token"));
  const [showLogin, setShowLogin] = useState(false);

  // Decode token to check expiration
  const isTokenExpired = (token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp * 1000 < Date.now(); // Compare expiration time with current time
    } catch (error) {
      console.error("Failed to decode token:", error);
      return true; // Treat as expired if decoding fails
    }
  };

  // Show login modal if token is missing or expired
  useEffect(() => {
    if (!token || isTokenExpired(token)) {
      toast.error("Session expired. Please log in again.");
      localStorage.removeItem("access_token");
      setToken(null);
      setShowLogin(true);
    }
  }, [token]);

  // On login modal close, update token
  const handleLoginClose = () => {
    const newToken = localStorage.getItem("access_token");
    if (newToken) {
      setToken(newToken);
      setShowLogin(false);
    }
  };

  // Fetch booking details when token & bookingId are available
  useEffect(() => {
    async function fetchBookingDetails() {
      if (!token) return;

      try {
        setIsLoading(true); // Start loading
        console.log("Fetching booking details with token:", token); // Debugging
        const res = await axios.get(
          `http://localhost:8000/api/booking/payment-details/${bookingId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const { booking, payment, summary } = res.data;
        setBookingDetails({ ...booking, payment, summary });
        console.log("Booking & payment details:", { booking, payment, summary });
      } catch (error) {
        console.error("Failed to fetch booking details:", error.response?.data || error.message);
        if (error.response && error.response.status === 401) {
          toast.error("Session expired. Please log in again.");
          localStorage.removeItem("access_token");
          setToken(null);
          setShowLogin(true);
        } else {
          toast.error("Unable to fetch booking details.");
        }
      } finally {
        setIsLoading(false); // End loading
      }
    }

    if (token && bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId, token]);

  const handlePaymentSelect = async (payment) => {
    setSelectedPayment(payment);

    if (!bookingDetails) {
      toast.error("Booking details are not loaded yet.");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:8000/api/auth/payment/initiate",
        {
          amount: bookingDetails.payment.amount,
          purchase_order_id: bookingId,
          purchase_order_name: bookingDetails.venueName || "EasyEvent",
          return_url: `http://localhost:5173/continue-payment/${bookingId}`,
          website_url: `http://localhost:5173/continue-payment/${bookingId}`,
          bookingId: bookingId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data && response.data.payment_url) {
        setPaymentUrl(response.data.payment_url);
        window.location.href = response.data.payment_url;
      } else {
        toast.error("Payment initiation failed: No payment URL received.");
      }
    } catch (error) {
      console.error("Payment initiation failed:", error.response?.data || error.message);
      if (error.response && error.response.status === 401) {
        toast.error("Session expired. Please login again.");
        localStorage.removeItem("access_token");
        setToken(null);
        setShowLogin(true);
      } else {
        toast.error("Payment initiation failed! Please try again.");
      }
    }
  };

  useEffect(() => {
    const verifyPayment = async () => {
      const pidx = searchParams.get("pidx");
      if (!pidx) return;

      try {
        const response = await axios.post(
          "http://localhost:8000/api/auth/payment/verify",
          { pidx },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data.status === "Completed") {
          toast.success("Payment successful!");
          navigate(`/user-dashboard/`, { replace: true });
        } else {
          toast.error("Payment verification failed.");
        }
      } catch (error) {
        console.error("Payment verification error:", error.response?.data || error.message);
        if (error.response && error.response.status === 401) {
          toast.error("Session expired. Please login again.");
          localStorage.removeItem("access_token");
          setToken(null);
          setShowLogin(true);
        } else {
          toast.error("Payment verification failed. Please try again.");
        }
      }
    };

    if (searchParams.has("pidx") && token) {
      verifyPayment();
    }
  }, [searchParams, token, bookingId, navigate]);

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="w-full max-w-md p-6 bg-white shadow-md rounded-lg">
          <h2 className="text-xl font-semibold text-center mb-4">Continue Payment</h2>
          {isLoading ? (
            <p className="text-center text-gray-500">Loading booking details...</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {paymentOptions.map((option) => (
                <button
                  key={option.name}
                  className={`flex items-center justify-between w-full p-4 border rounded-lg shadow-sm hover:bg-gray-200 transition ${
                    selectedPayment === option.name ? "bg-gray-300" : "bg-white"
                  }`}
                  onClick={() => handlePaymentSelect(option.name)}
                  disabled={!bookingDetails} // Disable button if booking details are not loaded
                >
                  <img src={option.logo} alt={option.name} className="h-12 w-12 object-contain" />
                  <span className="ml-2">{option.name}</span>
                </button>
              ))}
            </div>
          )}
          {selectedPayment && (
            <p className="text-center mt-4 text-green-600 font-medium">
              Selected: {selectedPayment}
            </p>
          )}
        </div>
      </div>

      {/* MiniLogin Modal */}
      <MiniLogin show={showLogin} onClose={handleLoginClose} />
    </>
  );
}