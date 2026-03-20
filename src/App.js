import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Schedule from './pages/Schedule';
import Staff from './pages/Staff';
import Clock from './pages/Clock';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{padding:'2rem',color:'#888'}}>Loading...</div>;
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/clock" element={<Clock />} />
          <Route path="/" element={<PrivateRoute><Schedule /></PrivateRoute>} />
          <Route path="/staff" element={<PrivateRoute><Staff /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
