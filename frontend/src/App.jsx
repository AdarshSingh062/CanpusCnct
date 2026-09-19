import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './routes/ProtectedRoute';
import SplitAxisConvergence from './components/ui/split-axis-convergence';

import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import Dashboard from './pages/Dashboard';
import Feed from './pages/Feed';
import Complaints from './pages/Complaints';
import ComplaintDetail from './pages/ComplaintDetail';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Clubs from './pages/Clubs';
import ClubDetail from './pages/ClubDetail';
import LostFound from './pages/LostFound';
import Marketplace from './pages/Marketplace';
import MarketplaceDetail from './pages/MarketplaceDetail';
import Resources from './pages/Resources';
import Opportunities from './pages/Opportunities';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Toaster position="top-right" toastOptions={{ style: { fontSize: '14px' } }} />
          <Routes>
            <Route path="/" element={<SplitAxisConvergence />} />
            <Route path="/showcase" element={<SplitAxisConvergence />} />

            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/feed" element={<Feed />} />
                <Route path="/complaints" element={<Complaints />} />
                <Route path="/complaints/:id" element={<ComplaintDetail />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:id" element={<EventDetail />} />
                <Route path="/clubs" element={<Clubs />} />
                <Route path="/clubs/:id" element={<ClubDetail />} />
                <Route path="/lost-found" element={<LostFound />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/marketplace/:id" element={<MarketplaceDetail />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/opportunities" element={<Opportunities />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/profile" element={<Profile />} />

                <Route element={<ProtectedRoute roles={['superadmin']} />}>
                  <Route path="/admin" element={<Admin />} />
                </Route>
                  </Route>
              </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
