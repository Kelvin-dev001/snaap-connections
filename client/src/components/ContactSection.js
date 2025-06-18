import React from "react";
import { FaPhoneAlt, FaWhatsapp, FaMapMarkerAlt, FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";

const ContactSection = () => {
  return (
    <div className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8" id="contact">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        {/* Contact Info */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-800">📍 Contact Us</h2>
          <p className="text-gray-600">Reach out to us via phone, WhatsApp, or social media. We’re happy to help!</p>
          
          <div className="space-y-2 text-gray-700">
            <div className="flex items-center gap-3"><FaMapMarkerAlt /> <span>123 Tech Street, Lagos, Nigeria</span></div>
            <div className="flex items-center gap-3"><FaPhoneAlt /> <a href="tel:+2348012345678" className="text-blue-500 hover:underline">+234 801 234 5678</a></div>
            <div className="flex items-center gap-3"><FaWhatsapp /> <a href="https://wa.me/2348012345678" className="text-green-500 hover:underline">Chat on WhatsApp</a></div>
          </div>

          {/* Working Hours */}
          <div>
            <h4 className="font-semibold text-gray-800 mt-4">Working Hours</h4>
            <p className="text-gray-600">Mon - Sat: 9:00 AM - 6:00 PM</p>
            <p className="text-gray-600">Sunday: Closed</p>
          </div>

          {/* Social Media */}
          <div className="flex gap-4 mt-4">
            <a href="#" className="text-blue-700 hover:scale-110 transition"><FaFacebook size={24} /></a>
            <a href="#" className="text-pink-500 hover:scale-110 transition"><FaInstagram size={24} /></a>
            <a href="#" className="text-blue-400 hover:scale-110 transition"><FaTwitter size={24} /></a>
          </div>
        </div>

        {/* Map & Directions */}
        <div className="w-full h-96 rounded-xl overflow-hidden shadow-lg">
          <iframe
            title="Google Map"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d..."
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
          ></iframe>
          <div className="mt-3">
            <a
              href="https://www.google.com/maps/dir//123+Tech+Street,+Lagos,+Nigeria"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 text-white py-2 px-4 rounded shadow hover:bg-blue-700 transition mt-4"
            >
              🧭 Get Directions
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSection;
