// src/components/AboutSection.jsx
import React from 'react';
import { motion } from 'framer-motion';

const AboutSection = () => {
  return (
    <section className="bg-gradient-to-br from-slate-900 to-black text-white py-16 px-6 md:px-20" id="about">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="max-w-5xl mx-auto text-center"
      >
        <h2 className="text-4xl font-bold mb-6 tracking-wide text-blue-400">About Snaap Connections</h2>
        <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-6">
          At <span className="text-white font-semibold">Snaap Connections</span>, we specialize in the sale of top-tier mobile phones, laptops, and accessories. 
          We connect people with technology that enhances lives — offering genuine products, expert support, and a seamless WhatsApp shopping experience.
        </p>
        <div className="mt-10 flex flex-col md:flex-row gap-8 justify-center items-center">
          <div className="bg-slate-800 p-6 rounded-xl shadow-md hover:shadow-blue-500/40 transition">
            <h3 className="text-xl font-semibold text-white mb-2">🚀 Our Mission</h3>
            <p className="text-gray-400">To empower everyone with reliable tech products through a seamless, accessible shopping experience.</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-xl shadow-md hover:shadow-blue-500/40 transition">
            <h3 className="text-xl font-semibold text-white mb-2">🌟 Our Vision</h3>
            <p className="text-gray-400">To become Africa’s leading tech connection hub — trusted, fast, and affordable.</p>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default AboutSection;
