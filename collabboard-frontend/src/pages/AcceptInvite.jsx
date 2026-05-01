import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const AcceptInvite = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [boardId, setBoardId] = useState(null);

  useEffect(() => {
    if (!user) {
      setStatus('unauthenticated');
      return;
    }

    const accept = async () => {
      try {
        const { data } = await api.get(`/invite/${token}`);
        setBoardId(data.boardId);
        setStatus('success');
        setTimeout(() => navigate(`/board/${data.boardId}`), 2000);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Invalid or expired invitation');
      }
    };

    accept();
  }, [token, user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8 text-center">
        <h1 className="text-2xl font-bold text-indigo-600 mb-2">CollabBoard</h1>

        {status === 'loading' && (
          <p className="text-gray-500 mt-4">Processing your invitation...</p>
        )}

        {status === 'unauthenticated' && (
          <div>
            <p className="text-gray-600 mt-4 mb-6">
              You need to be logged in to accept this invitation.
            </p>
            <Link
              to={`/login`}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition inline-block"
            >
              Sign In
            </Link>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mt-4 mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-700 font-medium">Successfully joined the board!</p>
            <p className="text-gray-400 text-sm mt-2">Redirecting you now...</p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mt-4 mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-600 font-medium">{message}</p>
            <Link
              to="/"
              className="mt-6 bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition inline-block"
            >
              Go to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcceptInvite;
