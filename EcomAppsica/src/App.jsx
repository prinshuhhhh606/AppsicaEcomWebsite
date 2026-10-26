import { useEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './Components/layout/navbar';
import Footer from './Components/layout/footer';
import AppRoutes from './routes/AppRoutes';
import './App.css';

function Storefront() {
  const location = useLocation();
  const isVendorRoute = location.pathname.startsWith('/vendor');
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isDeliveryRoute = location.pathname.startsWith('/delivery');
  const isStandalone = isVendorRoute || isAdminRoute || isDeliveryRoute;

  useEffect(() => {
    document.documentElement.dataset.theme = 'store';
  }, []);

  return (
    <div className={isAdminRoute ? 'admin-shell' : isVendorRoute ? 'vendor-shell' : isDeliveryRoute ? 'delivery-shell' : 'app-shell'}>
      {!isStandalone && <Navbar />}
      <main className={isAdminRoute ? 'admin-main' : isVendorRoute ? 'vendor-main' : isDeliveryRoute ? 'delivery-main' : 'app-main'}>
        <AppRoutes />
      </main>
      {!isStandalone && <Footer />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <NotificationProvider>
              <Storefront />
            </NotificationProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;