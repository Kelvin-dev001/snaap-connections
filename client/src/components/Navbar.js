// src/components/Navbar.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-black text-white px-4 py-3 shadow-md fixed w-full z-50">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-blue-400">Snaap Connections</h1>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        <ul className="hidden md:flex space-x-6">
          <li><a href="#home" className="hover:text-blue-400">Home</a></li>
          <li><a href="#products" className="hover:text-blue-400">Products</a></li>
          <li><a href="#about" className="hover:text-blue-400">About</a></li>
          <li><a href="#contact" className="hover:text-blue-400">Contact</a></li>
        </ul>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <ul className="md:hidden bg-gray-900 mt-2 space-y-2 px-4 py-3 rounded shadow-lg">
          <li><a href="#home" onClick={() => setMenuOpen(false)} className="block">Home</a></li>
          <li><a href="#products" onClick={() => setMenuOpen(false)} className="block">Products</a></li>
          <li><a href="#about" onClick={() => setMenuOpen(false)} className="block">About</a></li>
          <li><a href="#contact" onClick={() => setMenuOpen(false)} className="block">Contact</a></li>
        </ul>
      )}
    </nav>
  );
}
