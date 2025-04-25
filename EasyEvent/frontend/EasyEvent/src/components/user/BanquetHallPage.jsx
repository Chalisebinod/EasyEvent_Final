import React from "react";

const ProposalPage = () => {
  return (
    <div className="min-h-screen bg-pink-100">
      {/* Navigation Bar */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center px-4 py-3">
          <div className="text-2xl font-bold text-orange-500">EASY EVENTS</div>
          <nav className="flex items-center space-x-6">
            <a
              href="#"
              className="text-gray-700 hover:text-orange-500 font-medium"
            >
              HOME
            </a>
            <a
              href="#"
              className="text-gray-700 hover:text-orange-500 font-medium"
            >
              Explore Venues
            </a>
            <a
              href="#"
              className="text-gray-700 hover:text-orange-500 font-medium"
            >
              Bookings
            </a>
            <a
              href="#"
              className="text-gray-700 hover:text-orange-500 font-medium"
            >
              Proposal
            </a>
          </nav>
          {/* User Profile Image */}
          <div className="relative">
            <img
              src="https://via.placeholder.com/40"
              alt="User Profile"
              className="w-10 h-10 rounded-full border-2 border-orange-500 cursor-pointer hover:opacity-75 transition duration-200"
            />
          </div>
        </div>
      </header>

      {/* Banner Image */}
      <div className="relative">
        <img
          src="https://via.placeholder.com/1400x600"
          alt="Luxury Banquet Hall"
          className="w-full h-96 object-cover"
        />
        <h1 className="absolute bottom-6 left-6 text-white text-4xl font-bold bg-black bg-opacity-50 px-6 py-3 rounded-lg">
          Luxury Banquet Hall
        </h1>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Event Details Section */}
        <section className="bg-white shadow-md rounded-lg p-8 mb-8 w-full">
          <h2 className="text-3xl font-semibold text-orange-500 mb-6">
            Event Details
          </h2>
          <form className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-600 mb-1">Function Type</label>
              <select className="w-full border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500">
                <option>Select Type</option>
                <option>Wedding</option>
                <option>Corporate</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-600 mb-1">Date</label>
              <input
                type="date"
                className="w-full border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1">
                Food Preferences
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" /> Vegetarian
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" /> Non-Vegetarian
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" /> Only Venue
                </label>
              </div>
            </div>
            <div>
              <label className="block text-gray-600 mb-1">No. of Seats</label>
              <input
                type="number"
                className="w-full border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-gray-600 mb-1">
                Offer Your Fare
              </label>
              <input
                type="number"
                placeholder="Amount (Rs)"
                className="w-full border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Recommended fare: 10002
              </p>
            </div>
          </form>
          <button className="mt-6 w-full bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600">
            Send Request
          </button>
        </section>

        {/* Gallery Section */}
        <section className="bg-white shadow-md rounded-lg p-8 mb-8 w-full">
          <h2 className="text-3xl font-semibold text-orange-500 mb-6">
            Gallery
          </h2>
          <div className="flex overflow-x-auto space-x-6">
            {Array.from({ length: 10 }).map((_, index) => (
              <img
                key={index}
                src={`https://via.placeholder.com/400x400?text=Image+${
                  index + 1
                }`}
                alt={`Image ${index + 1}`}
                className="w-96 h-64 object-cover rounded-lg shadow-md"
              />
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-white shadow-md rounded-lg p-8 mb-8 w-full">
          <h2 className="text-3xl font-semibold text-orange-500 mb-6">
            Features
          </h2>
          <ul className="space-y-4 text-gray-700">
            <li className="text-lg flex items-center space-x-3">
              <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
              <span>Professional Event Setup Services</span>
            </li>
            <li className="text-lg flex items-center space-x-3">
              <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
              <span>Dedicated Catering Services with Customized Menus</span>
            </li>
            <li className="text-lg flex items-center space-x-3">
              <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
              <span>Ample Parking Facilities</span>
            </li>
            <li className="text-lg flex items-center space-x-3">
              <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
              <span>State-of-the-Art Sound & Lighting Systems</span>
            </li>
            <li className="text-lg flex items-center space-x-3">
              <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
              <span>Ample Dance Floors and Photo Zones</span>
            </li>
            <li className="text-lg flex items-center space-x-3">
              <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
              <span>Central Location with Scenic Surroundings</span>
            </li>
          </ul>
        </section>

        {/* History Section */}
        <section className="bg-white shadow-md rounded-lg p-8 mb-8 w-full">
          <h2 className="text-3xl font-semibold text-orange-500 mb-6">
            History
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            Established in 2015, The Grand Elegance Hall quickly became a
            popular choice among Kathmandu residents for hosting large and
            upscale gatherings. It boasts a rich history of hosting high-profile
            weddings, corporate events, and cultural nights, becoming a symbol
            of grandeur and style in event planning. Book your next event at The
            Grand Elegance Hall and ensure a seamless, stunning, and
            unforgettable experience for you and your guests.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-orange-500 text-white py-6">
        <div className="max-w-6xl mx-auto grid grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Our Company</h3>
            <ul className="space-y-1">
              <li>About Us</li>
              <li>Careers</li>
              <li>Contact</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Contact</h3>
            <ul className="space-y-1">
              <li>Email: support@easyevents.com</li>
              <li>Phone: 123-456-7890</li>
              <li>Location: Kathmandu, Nepal</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Social Media</h3>
            <ul className="space-y-1">
              <li>Facebook</li>
              <li>Instagram</li>
              <li>LinkedIn</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProposalPage;
