import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './notifications/NotificationBell';

const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const Navbar = ({ transparent }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav
      className={`flex items-center justify-between px-6 py-3 ${
        transparent ? 'bg-transparent' : 'bg-white border-b border-gray-200 shadow-sm'
      }`}
    >
      {/* Brand */}
      <Link
        to="/"
        className={`text-xl font-bold ${transparent ? 'text-white' : 'text-indigo-600'}`}
      >
        CollabBoard
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <NotificationBell />

        {/* User Avatar + Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown((p) => !p)}
            className="flex items-center gap-2 hover:opacity-80 transition"
          >
            <span className="bg-indigo-500 text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center">
              {getInitials(user?.name || '?')}
            </span>
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-11 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
