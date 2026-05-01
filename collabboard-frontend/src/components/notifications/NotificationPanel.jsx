import { useNavigate } from 'react-router-dom';
import { formatRelative } from '../../utils/formatDate';

const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const NotificationPanel = ({ notifications, loading, onMarkRead, onMarkAllRead, onClose }) => {
  const navigate = useNavigate();
  const hasUnread = notifications.some((n) => !n.read);

  const handleClick = (n) => {
    if (!n.read) onMarkRead(n._id);
    if (n.board) {
      const boardId = typeof n.board === 'object' ? n.board._id : n.board;
      navigate(`/board/${boardId}`);
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Notifications panel"
      className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
        {hasUnread && (
          <button
            onClick={onMarkAllRead}
            className="text-xs text-indigo-600 hover:underline font-medium"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto" role="list">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-400 text-sm">Loading...</div>
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="flex items-center justify-center py-10">
            <div className="text-center">
              <svg className="w-10 h-10 text-gray-200 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-gray-400 text-sm">No notifications yet</p>
            </div>
          </div>
        )}

        {!loading &&
          notifications.map((n) => (
            <button
              key={n._id}
              role="listitem"
              onClick={() => handleClick(n)}
              aria-label={`${n.actor?.name || 'Someone'} ${n.message}${!n.read ? ', unread' : ''}`}
              className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 ${
                !n.read ? 'bg-indigo-50' : ''
              }`}
            >
              <span className="bg-indigo-500 text-white text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
                {getInitials(n.actor?.name || '?')}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 leading-snug">
                  <span className="font-semibold">{n.actor?.name || 'Someone'}</span>{' '}
                  {n.message}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{formatRelative(n.createdAt)}</p>
              </div>
              {!n.read && (
                <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-2" aria-hidden="true" />
              )}
            </button>
          ))}
      </div>
    </div>
  );
};

export default NotificationPanel;
