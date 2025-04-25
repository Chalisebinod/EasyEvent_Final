import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const EmailVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

  // Redirect if email is not provided
  useEffect(() => {
    if (!email) {
      setErrorMessage("Email not found. Redirecting...");
      setTimeout(() => navigate("/forgot-password"), 8000);
    }
  }, [email, navigate]);

  // OTP expiration countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          setErrorMessage("OTP has expired. Please request a new one.");
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle OTP verification
  const handleOtpVerification = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 4) {
      setErrorMessage("Please enter the full OTP.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpString }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrorMessage(`Error: ${errorData.message}`);
        return;
      }

      const data = await response.json();
      setSuccessMessage("OTP Verified Successfully");

      // Store the new token received from the server
      if (data.token) {
        localStorage.setItem("authToken", data.token); // Store the new token
      }

      // Navigate to the password-change page after OTP verification
      setTimeout(() => navigate("/password-change", { state: { email, otp } }), 2000);
    } catch (error) {
      setErrorMessage("An unexpected error occurred. Please try again.");
    }
  };

  // Format time in minutes:seconds
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Handle OTP input change
  const handleOtpChange = (e, index) => {
    const value = e.target.value;
    if (/[^0-9]/.test(value)) return; // Only allow numbers

    const updatedOtp = [...otp];
    updatedOtp[index] = value;
    setOtp(updatedOtp);

    // Focus on next input field if current one is filled
    if (value && index < 3) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center mb-6 text-gray-700">
          Email Verification
        </h2>
        <p className="text-center mb-6 text-gray-600">
          We have sent a code to your email <strong>{email}</strong>.
        </p>

        <div className="flex justify-between mb-6">
          {otp.map((digit, index) => (
            <input
              key={index}
              type="text"
              id={`otp-${index}`}
              maxLength="1"
              value={digit}
              onChange={(e) => handleOtpChange(e, index)}
              className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          ))}
        </div>

        <button
          onClick={handleOtpVerification}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-md transition duration-200"
          disabled={timeLeft === 0 || otp.join("").length !== 4}
        >
          Verify Account
        </button>

        {timeLeft > 0 && (
          <p className="text-center mt-4 text-sm text-gray-600">
            OTP expires in: {formatTime(timeLeft)}
          </p>
        )}

        {errorMessage && (
          <p className="text-center mt-4 text-sm text-red-500 font-medium">
            {errorMessage}
          </p>
        )}
        {successMessage && (
          <p className="text-center mt-4 text-sm text-green-500 font-medium">
            {successMessage}
          </p>
        )}

        {timeLeft === 0 && (
          <div className="mt-4 text-center">
            <a
              href="/forgot-password"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Didn’t receive code? Resend OTP
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;
