import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify"; // Import toast for notifications
import 'react-toastify/dist/ReactToastify.css'; // Import toast styles

const PasswordChange = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  // Retrieve the email passed via state (no OTP needed)
  const { email,otp } = location.state || {}; 

  const validatePassword = (password) => {
    return /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!validatePassword(password)) {
      setError(
        "Password must be at least 8 characters long, include an uppercase letter, a number, and a special character."
      );
      return;
    }
  
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
  
    if (!checked) {
      setError("You must accept the Terms and Conditions.");
      return;
    }
  
    setError("");
    setLoading(true);
  
    try {
      // Convert OTP array to a single string
      const otpString = Array.isArray(otp) ? otp.join("") : otp;
  
      // Make the API request to reset the password
      const response = await axios.post(
        "http://localhost:8000/api/reset-password",
        {
          email,
          otp: otpString, // Send the OTP as a single string
          newPassword: password, // Send the new password
        }
      );
  
      if (response.status === 200) {
        setLoading(false);
  
        // Show success toast
        toast.success("Successfully changed password!");
  
        // Redirect to login after a delay
        setTimeout(() => {
          navigate("/login");
        }, 2000); // 2-second delay before redirect
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
      setError("Failed to update password. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-6 w-96">
        <h2 className="text-2xl font-semibold text-center text-gray-800">
          Change Password
        </h2>

        <form onSubmit={handleSubmit} className="mt-4">
          <div className="mb-3">
            <label className="block text-gray-700 font-medium mb-1">
              New Password
            </label>
            <input
              type="password"
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="block text-gray-700 font-medium mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              className="w-4 h-4"
              checked={checked}
              onChange={() => setChecked(!checked)}
            />
            <label className="text-gray-600 text-sm">
              I accept the{" "}
              <a href="#" className="text-blue-500 hover:underline">
                Terms and Conditions
              </a>
            </label>
          </div>

          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition flex items-center justify-center"
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                ></path>
              </svg>
            ) : (
              "Reset Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordChange;
