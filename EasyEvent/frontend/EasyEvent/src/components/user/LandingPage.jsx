import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowRightIcon, 
  CheckCircleIcon, 
  StarIcon, 
  ShieldCheckIcon, 
  SparklesIcon,
  CalendarCheck,
  MapPin,
  CreditCard
} from "lucide-react";
import LandingImage from "../images/Landing.png"; 
import BottomNavbar from "./BottomNavbar";

// Feature Card Component
const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="group bg-white p-6 rounded-xl border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-2">
    <div className="flex items-center mb-4">
      <Icon
        className="w-10 h-10 text-green-600 mr-4 group-hover:rotate-6 transition-transform"
        strokeWidth={1.5}
      />
      <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
    </div>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const venueOwnerSectionRef = useRef(null);

  const scrollToVenueOwnerSection = () => {
    if (venueOwnerSectionRef.current) {
      venueOwnerSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen antialiased">
      {/* Header with zero horizontal margin */}
      <header className="fixed w-full top-0 z-50 bg-white shadow-sm">
  <div className="flex items-center justify-between h-16 pl-6 pr-20 pl-20">
    {/* EasyEvents logo */}
    <div
      className="text-2xl md:text-3xl font-bold cursor-pointer flex items-center"
      onClick={() => navigate("/")}
    >
      <span className="text-orange-600">Easy</span>
      <span className="text-orange-600">Event</span>
    </div>

    {/* Login Button */}
    <div className="flex items-center">
      <button
        onClick={() => navigate("/login")}
        className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
      >
        <span>Login</span>
        <ArrowRightIcon className="w-4 h-4" />
      </button>
    </div>
  </div>
</header>




      {/* Hero Section */}
      <section
        className="relative pt-24 pb-16 md:pt-36 md:pb-24 bg-cover bg-center h-screen"
        style={{
          backgroundImage: `url(${LandingImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-orange-950 opacity-50"></div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 flex flex-col justify-center h-full text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
            Simplify Your Event Venue Discovery
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto">
            Discover, compare, and book the perfect venues for weddings,
            corporate events, and celebrations.
          </p>

          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={scrollToVenueOwnerSection}
              className="px-8 py-3  bg-white text-orange-600 rounded-full font-semibold hover:bg-white/20 transition-colors shadow-md"
            >
              List Your Venue
            </button>
            <button
              onClick={() => navigate("/user-dashboard-before")}
              className="px-8 py-3 border-2 border-white text-white rounded-full font-semibold hover:bg-white/20 transition-colors"
            >
              Explore Venues
            </button>
          </div>
        </div>
      </section>

      {/* Event Planner Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Designed for Event Planners
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Streamline your event planning with our comprehensive venue booking
              platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={CalendarCheck}
              title="Extensive Venues"
              description="Access a diverse range of verified venues, from intimate spaces to grand halls."
            />
            <FeatureCard
              icon={MapPin}
              title="Easy Location"
              description="Find perfect venues based on location, capacity, and amenities."
            />
            <FeatureCard
              icon={CreditCard}
              title="Secure Transactions"
              description="Safe, encrypted payment systems ensuring complete transaction security."
            />
          </div>
        </div>
      </section>

      {/* Venue Owner Section */}
      <section ref={venueOwnerSectionRef} className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
            For Venue Owners
          </h2>
          <p className="text-xl text-gray-600 mb-10">
            Grow your business by reaching more clients through our platform
          </p>

          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate("/login")}
              className="px-8 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors shadow-md"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/venue-owner-signup")}
              className="px-8 py-3 border-2 border-green-600 text-green-600 rounded-full hover:bg-green-600 hover:text-white transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>
      </section>

      {/* Why Choose EasyEvents */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Why Choose EasyEvents
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A trusted platform connecting event planners with premium venues
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={SparklesIcon}
              title="Verified Venues"
              description="Every venue is meticulously verified to ensure quality and reliability."
            />
            <FeatureCard
              icon={CheckCircleIcon}
              title="Seamless Experience"
              description="From discovery to booking, enjoy a smooth and intuitive process."
            />
            <FeatureCard
              icon={ShieldCheckIcon}
              title="24/7 Support"
              description="Our dedicated support team is always ready to assist you."
            />
          </div>
        </div>
      </section>

      <BottomNavbar />
    </div>
  );
};

export default LandingPage;
