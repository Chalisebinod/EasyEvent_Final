import React from "react";
import { useNavigate } from "react-router-dom";

const BottomNavbar = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-slate-900 text-white py-10">
      <div className="container mx-auto px-4 md:px-8 space-y-10">
        {/* Contact and Help Section */}
        <div className="flex flex-col md:flex-row justify-between">
          <div>
            <h3 className="text-2xl font-semibold mb-3 text-orange-500">
              Contact Us
            </h3>
            <p className="mb-1">
              <span className="font-medium text-gray-300">Email: </span>
              <a
                href="mailto:chalisebinod40@gmail.com"
                className="text-orange-400 hover:underline"
              >
                chalisebinod40@gmail.com
              </a>
            </p>
            <p className="mb-1">
              <span className="font-medium text-gray-300">Phone: </span>
              <a
                href="tel:+9779863335795"
                className="text-orange-400 hover:underline"
              >
                +977-9863335795
              </a>
            </p>
            <p className="text-gray-300">Address: Kathmandu, Nepal</p>
          </div>

          <div className="mt-6 md:mt-0 md:text-right">
            <h3 className="text-2xl font-semibold mb-3 text-orange-500">
              Suggestions & Support
            </h3>
            <p className="text-gray-300">
              For suggestions, feedback, or any help, feel free to contact our
              customer care team.
            </p>
            <p className="text-gray-300 mt-1">We’re here to help you 24/7.</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap justify-center space-x-6 border-t border-gray-700 pt-6">
          <button
            onClick={() => navigate("/about")}
            className="text-sm text-gray-400 hover:text-orange-400 transition duration-200"
          >
            About Us
          </button>
          <button
            onClick={() => navigate("/privacy")}
            className="text-sm text-gray-400 hover:text-orange-400 transition duration-200"
          >
            Privacy Policy
          </button>
          <button
            onClick={() => navigate("/terms")}
            className="text-sm text-gray-400 hover:text-orange-400 transition duration-200"
          >
            Terms of Service
          </button>
          <button
            onClick={() => navigate("/faq")}
            className="text-sm text-gray-400 hover:text-orange-400 transition duration-200"
          >
            FAQ
          </button>
        </div>

        {/* Footer Bottom */}
        <div className="text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} EasyEvents. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
};

export default BottomNavbar;
