import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Board from './pages/Board';
import AcceptInvite from './pages/AcceptInvite';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <ErrorBoundary>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: { fontSize: '14px' },
                error: { duration: 5000 },
              }}
            />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/invite/:token" element={<AcceptInvite />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/board/:boardId"
                element={
                  <ProtectedRoute>
                    <Board />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </ErrorBoundary>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
