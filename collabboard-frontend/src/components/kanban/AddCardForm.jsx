import { useState, useRef, useEffect } from 'react';
import api from '../../api/axios';

const AddCardForm = ({ listId, boardId, onCardAdded, show, setShow }) => {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (show && inputRef.current) {
      inputRef.current.focus();
    }
  }, [show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/cards', {
        title: title.trim(),
        listId,
        boardId,
      });
      onCardAdded(data);
      setTitle('');
      setShow(false);
    } catch (err) {
      console.error('Failed to create card:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="w-full text-left text-gray-500 hover:text-gray-700 hover:bg-white/70 text-sm px-2 py-1.5 rounded-lg transition"
      >
        + Add a card
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-2">
      <textarea
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
          if (e.key === 'Escape') {
            setShow(false);
            setTitle('');
          }
        }}
        placeholder="Enter card title..."
        rows={2}
        className="w-full text-sm text-gray-800 focus:outline-none resize-none p-1"
      />
      <div className="flex gap-2 mt-2">
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="bg-indigo-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-60"
        >
          {loading ? '...' : 'Add Card'}
        </button>
        <button
          type="button"
          onClick={() => {
            setShow(false);
            setTitle('');
          }}
          className="text-gray-400 hover:text-gray-600 text-sm px-2 py-1.5"
        >
          ✕
        </button>
      </div>
    </form>
  );
};

export default AddCardForm;
