import { useState } from 'react';
import api from '../../api/axios';

const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const COLORS = ['bg-indigo-500', 'bg-pink-500', 'bg-green-500', 'bg-yellow-500', 'bg-blue-500', 'bg-purple-500'];

const InviteModal = ({ boardId, members, onClose }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email.trim()) return;
    setLoading(true);
    try {
      await api.post('/invite', { email: email.trim(), boardId });
      setSuccess(`Invitation sent to ${email.trim()}`);
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-800 text-lg">Invite to Board</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">
            ✕
          </button>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-4 text-sm">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {loading ? '...' : 'Send'}
            </button>
          </div>
        </form>

        {/* Member list */}
        <div>
          <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">
            Board Members ({members.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {members.map((m, idx) => (
              <div
                key={m.user?._id || idx}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
              >
                <span
                  className={`${COLORS[idx % COLORS.length]} text-white text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0`}
                >
                  {getInitials(m.user?.name || '?')}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {m.user?.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{m.user?.email}</p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    m.role === 'admin'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteModal;
