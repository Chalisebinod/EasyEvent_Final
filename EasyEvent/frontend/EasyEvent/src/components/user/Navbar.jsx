import React, { useState } from "react";
import { FaUserCircle, FaBars, FaTimes } from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-slate-800 py-4 text-white shadow-xl sticky top-0 z-50 border-b border-slate-700 mb-px">
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <div
          className="text-3xl md:text-4xl font-bold cursor-pointer flex items-center font-[Poppins]"
          onClick={() => navigate("/user-dashboard")}
        >
          <span className="text-amber-400">Easy</span>
          <span className="text-slate-100">Event</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-9">
          {[
            { path: "/user-dashboard", label: "Home" },
            { path: "/user-bookings", label: "My Bookings" },
            { path: "/user-chat", label: "Chat" },
            { path: "/about-us", label: "About Us" },
          ].map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="relative px-4 py-2.5 text-lg font-medium group transition-colors duration-300"
            >
              <span className="relative z-10">{item.label}</span>
              <span className="absolute inset-0 h-full w-0 bg-slate-800 transition-all duration-300 group-hover:w-full rounded-lg"></span>
            </Link>
          ))}
        </nav>

        {/* Icons & Mobile Menu */}
        <div className="flex items-center space-x-4">
          {/* Profile Icon */}
          <div
            className="cursor-pointer transition-transform duration-200 hover:scale-110 hover:text-amber-400"
            onClick={() => navigate("/user-profile")}
          >
            <FaUserCircle className="text-3xl text-slate-300" />
          </div>

          {/* Mobile Menu Toggle */}
          <div
            className="md:hidden p-2.5 rounded-lg hover:bg-slate-800 transition-colors duration-300 cursor-pointer border border-slate-700"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <FaTimes className="text-xl text-amber-400" />
            ) : (
              <FaBars className="text-xl" />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-800 border-b border-slate-700">
          <nav className="flex flex-col">
            {[
              { path: "/user-dashboard", label: "Home" },
              { path: "/user-bookings", label: "My Bookings" },
              { path: "/user-chat", label: "Chat" },
              { path: "/about-us", label: "About Us" },
            ].map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="px-6 py-4 border-b border-slate-700 hover:bg-slate-700/50 transition-colors duration-300 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;