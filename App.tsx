console.log("🔥 TEST UPDATE OK 🔥");

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ShipmentList } from './pages/ShipmentList';
import { NewShipment } from './pages/NewShipment';
import { CashRegister } from './pages/CashRegister';
import { Settings } from './pages/Settings';
import { DepartureListManager } from './pages/DepartureList';
import { User } from './types';
import { ThemeProvider } from './contexts/ThemeContext';
import { ShipmentProvider } from './contexts/ShipmentContext';

// Protected Layout Wrapper that handles auth check and layout rendering
const ProtectedLayout = ({ user, onLogout }: { user: User | null, onLogout: () => void }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout user={user} onLogout={onLogout}>
      <Outlet />
    </Layout>
  );
};

function App() {
  const [user, setUser] = useState<User | null>(null);

  return (
    <ThemeProvider>
      <ShipmentProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login onLogin={setUser} />} />

            {/* Protected Routes (Wrapped in Layout) */}
            <Route element={<ProtectedLayout user={user} onLogout={() => setUser(null)} />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/shipments" element={<ShipmentList />} />
              <Route path="/new-shipment" element={<NewShipment />} />
              <Route path="/edit-shipment/:id" element={<NewShipment />} />
              <Route path="/cash-register" element={<CashRegister />} />
              <Route path="/departures" element={<DepartureListManager />} />
              <Route path="/history" element={<Navigate to="/departures" replace />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ShipmentProvider>
    </ThemeProvider>
  );
}

export default App;