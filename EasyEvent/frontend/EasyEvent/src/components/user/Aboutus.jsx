import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import Navbar from "./Navbar";

export default function AboutUs() {
  const navigate = useNavigate(); // Initialize navigate

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-grow bg-white-100 py-12 px-6 md:px-16 lg:px-24">
        <div className="max-w-4xl mx-auto space-y-16">
          {/* Our Mission */}
          <motion.section
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-orange-600">
              Our Mission
            </h2>
            <p className="text-gray-700 mt-4 text-lg leading-relaxed">
              Simplifying event planning by connecting people with the perfect
              venues and services. We aim to make the process secure, efficient,
              and enjoyable for everyone.
            </p>
          </motion.section>

          {/* Our Story */}
          <motion.section
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white shadow-lg rounded-xl p-8"
          >
            <h3 className="text-2xl font-semibold text-orange-600">Our Story</h3>
            <p className="text-gray-700 mt-4 leading-relaxed">
              Our journey began when we realized how stressful event planning can be.
              We built EasyEvents to change that—by leveraging modern tech to give you a
              seamless platform where searching, booking, and managing venues is a breeze.
            </p>
          </motion.section>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-white shadow-md rounded-lg p-6"
            >
              <h4 className="text-xl font-semibold text-orange-600">What We Offer</h4>
              <ul className="text-gray-700 mt-4 space-y-2">
                <li>✔ Verified Venue Details</li>
                <li>✔ Secure Transactions</li>
                <li>✔ Real-Time Messaging</li>
                <li>✔ Customized Solutions</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="bg-white shadow-md rounded-lg p-6"
            >
              <h4 className="text-xl font-semibold text-orange-600">By the Numbers</h4>
              <ul className="text-gray-700 mt-4 space-y-2">
                <li>📌 1000+ Venues Listed</li>
                <li>📌 500+ Events Booked Monthly</li>
                <li>📌 95% Customer Satisfaction</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="bg-white shadow-md rounded-lg p-6"
            >
              <h4 className="text-xl font-semibold text-orange-600">Contact Us</h4>
              <p className="text-gray-700 mt-4">Have questions or need assistance?</p>
              <p className="mt-2">📧 chalisebinod40@gmail.com</p>
              <p>📞 +977‑9863335795</p>
              <p>📍 Kathmandu, Nepal</p>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Call to Action */}
      <section className="bg-slate-900 py-12 text-center">
        <motion.h2
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-2xl md:text-3xl font-bold text-white mb-4"
        >
          Ready to Plan Your Next Event?
        </motion.h2>
        <button
          onClick={() => navigate("/user-dashboard")}
          className="px-6 py-3 bg-white text-orange-600 font-semibold rounded-full shadow-lg hover:bg-gray-100 transition"
        >
          Get Started
        </button>
      </section>
    </div>
  );
}
