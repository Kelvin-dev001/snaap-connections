import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import React, { Suspense } from 'react';

// Use React.lazy to split Footer from the main bundle
const Footer = React.lazy(() => import('../components/Footer'));

const AppLayout = () => {
  return (
    <div className="app">
      <Header />
      <main style={{ minHeight: "60vh" }}>
        <Outlet />
      </main>
      {/* Lazy-load Footer so it doesn't block above-the-fold render */}
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default AppLayout;