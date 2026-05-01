import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import KanbanBoard from '../components/kanban/KanbanBoard';
import InviteModal from '../components/invite/InviteModal';

const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const COLORS = ['bg-indigo-500', 'bg-pink-500', 'bg-green-500', 'bg-yellow-500', 'bg-blue-500', 'bg-purple-500'];

const BoardSkeleton = () => (
  <div className="flex gap-4 p-4 items-start">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="flex-shrink-0 w-72 bg-white/20 rounded-xl h-64 animate-pulse" />
    ))}
  </div>
);

const Board = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const { user } = useAuth();

  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInvite, setShowInvite] = useState(false);

  const fetchBoard = useCallback(async () => {
    try {
      const { data } = await api.get(`/boards/${boardId}`);
      setBoard(data);
      const sortedLists = [...(data.lists || [])].sort((a, b) => a.position - b.position);
      setLists(
        sortedLists.map((l) => ({
          ...l,
          cards: [...(l.cards || [])].sort((a, b) => a.position - b.position),
        }))
      );
    } catch (err) {
      if (err.response?.status === 403) {
        navigate('/');
      } else {
        setError('Failed to load board');
      }
    } finally {
      setLoading(false);
    }
  }, [boardId, navigate]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  useEffect(() => {
    if (!socket) return;

    socket.emit('join:board', boardId);

    const handleCardCreated = (card) => {
      setLists((prev) =>
        prev.map((list) =>
          list._id === card.list ? { ...list, cards: [...list.cards, card] } : list
        )
      );
    };

    const handleCardMoved = ({ cardId, sourceListId, destListId, position, card: updatedCard }) => {
      setLists((prev) => {
        let movedCard = null;
        const updated = prev.map((list) => {
          if (list._id === sourceListId) {
            movedCard = list.cards.find((c) => c._id === cardId) || movedCard;
            return { ...list, cards: list.cards.filter((c) => c._id !== cardId) };
          }
          return list;
        });
        if (!movedCard && !updatedCard) return prev;
        return updated.map((list) => {
          if (list._id === destListId) {
            const cardToInsert = updatedCard || movedCard;
            const newCards = [...list.cards];
            newCards.splice(position, 0, { ...cardToInsert, list: destListId, position });
            return { ...list, cards: newCards };
          }
          return list;
        });
      });
    };

    const handleCardUpdated = (updatedCard) => {
      setLists((prev) =>
        prev.map((list) =>
          list._id === updatedCard.list
            ? { ...list, cards: list.cards.map((c) => (c._id === updatedCard._id ? updatedCard : c)) }
            : list
        )
      );
    };

    const handleListCreated = (newList) => {
      setLists((prev) => {
        if (prev.some((l) => l._id === newList._id)) return prev;
        return [...prev, { ...newList, cards: [] }];
      });
    };

    socket.on('card:created', handleCardCreated);
    socket.on('card:moved', handleCardMoved);
    socket.on('card:updated', handleCardUpdated);
    socket.on('list:created', handleListCreated);

    return () => {
      socket.emit('leave:board', boardId);
      socket.off('card:created', handleCardCreated);
      socket.off('card:moved', handleCardMoved);
      socket.off('card:updated', handleCardUpdated);
      socket.off('list:created', handleListCreated);
    };
  }, [socket, boardId]);

  const handleAddList = async (title) => {
    try {
      const { data } = await api.post('/lists', { title, boardId });
      setLists((prev) => {
        if (prev.some((l) => l._id === data._id)) return prev;
        return [...prev, { ...data, cards: [] }];
      });
      if (socket) socket.emit('list:create', { boardId, list: data });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create list');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-indigo-600 flex flex-col">
        <Navbar transparent />
        <div className="px-6 py-3 flex items-center gap-4 bg-indigo-700/50">
          <div className="h-7 w-48 bg-white/20 rounded animate-pulse" />
        </div>
        <div className="flex-1 overflow-hidden">
          <BoardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button
            onClick={fetchBoard}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition text-sm font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-600 flex flex-col">
      <Navbar transparent />

      <div className="px-6 py-3 flex items-center gap-4 bg-indigo-700/50 backdrop-blur-sm">
        <h1 className="text-white font-bold text-xl">{board?.title}</h1>
        <div className="flex items-center gap-1 ml-2">
          {board?.members?.slice(0, 6).map((m, idx) => (
            <span
              key={m.user?._id || idx}
              title={m.user?.name}
              className={`${COLORS[idx % COLORS.length]} text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center border-2 border-white/50`}
            >
              {getInitials(m.user?.name || '?')}
            </span>
          ))}
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="ml-2 bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1.5 rounded-lg transition"
        >
          + Invite
        </button>
      </div>

      {lists.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-white/70">
            <p className="text-lg mb-2">This board has no lists yet</p>
            <p className="text-sm">Click &ldquo;+ Add a list&rdquo; to get started</p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <KanbanBoard
          boardId={boardId}
          lists={lists}
          setLists={setLists}
          onAddList={handleAddList}
          socket={socket}
          board={board}
        />
      </div>

      {showInvite && (
        <InviteModal
          boardId={boardId}
          members={board?.members || []}
          onClose={() => setShowInvite(false)}
        />
      )}
    </div>
  );
};

export default Board;
