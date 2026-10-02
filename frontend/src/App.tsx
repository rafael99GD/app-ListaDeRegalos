import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CreateWishlistModal } from './components/CreateWishlistModal';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';

// Pages
import { Dashboard } from './pages/Dashboard';
import { WishlistDetail } from './pages/WishlistDetail';
import { PublicWishlist } from './pages/PublicWishlist';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { VerifyOtp } from './pages/VerifyOtp';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Friends } from './pages/Friends';
import { SecretSanta } from './pages/SecretSanta';
import { Profile } from './pages/Profile';

const AppContent: React.FC = () => {
  const [isGlobalCreateModalOpen, setIsGlobalCreateModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200 pb-20 md:pb-0">
      <Navbar onOpenCreateModal={() => setIsGlobalCreateModalOpen(true)} />

      <main className="flex-1">
        <Routes>
          {/* Public guest view for wishlists */}
          <Route path="/w/:shareSlug" element={<PublicWishlist />} />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Dashboard & Detail Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wishlist/:id"
            element={
              <ProtectedRoute>
                <WishlistDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/friends"
            element={
              <ProtectedRoute>
                <Friends />
              </ProtectedRoute>
            }
          />
          <Route
            path="/secret-santa"
            element={
              <ProtectedRoute>
                <SecretSanta />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global Create Wishlist Modal triggered from Navbar */}
      <CreateWishlistModal
        isOpen={isGlobalCreateModalOpen}
        onClose={() => setIsGlobalCreateModalOpen(false)}
        onSuccess={(created) => {
          navigate(`/wishlist/${created.id}`);
        }}
      />

      {/* PWA Mobile & Desktop Install Prompt */}
      <PwaInstallPrompt />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
