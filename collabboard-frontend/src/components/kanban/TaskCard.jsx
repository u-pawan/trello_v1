import { useState, useEffect, useRef } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const LABEL_COLORS = {
  red: 'bg-red-400',
  orange: 'bg-orange-400',
  yellow: 'bg-yellow-400',
  green: 'bg-green-400',
  blue: 'bg-blue-400',
  purple: 'bg-purple-400',
  pink: 'bg-pink-400',
};

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-pink-500', 'bg-green-500',
  'bg-yellow-500', 'bg-blue-500', 'bg-purple-500',
];

const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const formatDue = (date) => {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const isPastDue = (date) => date && new Date(date) < new Date();

const TaskCard = ({ card, index, listId, boardId, board, onCardUpdated, onCardDeleted, socket }) => {
  const [showModal, setShowModal] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const [editDesc, setEditDesc] = useState(card.description || '');
  const [editDue, setEditDue] = useState(
    card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : ''
  );
  const [editLabels, setEditLabels] = useState(card.labels || []);
  const [assignEmail, setAssignEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [error, setError] = useState('');
  const firstFocusRef = useRef(null);

  const hasUnsavedChanges =
    editTitle.trim() !== card.title ||
    editDesc !== (card.description || '') ||
    editDue !== (card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : '') ||
    JSON.stringify(editLabels) !== JSON.stringify(card.labels || []);

  const openModal = () => {
    setEditTitle(card.title);
    setEditDesc(card.description || '');
    setEditDue(card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : '');
    setEditLabels(card.labels || []);
    setShowModal(true);
    setError('');
  };

  const closeModal = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Discard them?')) return;
    }
    setShowModal(false);
    setDeleteConfirm(false);
  };

  // Focus first element when modal opens
  useEffect(() => {
    if (showModal && firstFocusRef.current) {
      setTimeout(() => firstFocusRef.current?.focus(), 50);
    }
  }, [showModal]);

  // Trap focus within modal and close on Escape
  useEffect(() => {
    if (!showModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal, hasUnsavedChanges]);

  const handleSave = async () => {
    if (!editTitle.trim()) {
      setError('Title is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: editTitle.trim(),
        description: editDesc,
        dueDate: editDue || null,
        labels: editLabels,
      };
      const { data } = await api.put(`/cards/${card._id}`, payload);
      onCardUpdated(data);
      if (socket) socket.emit('card:update', { boardId, card: data });
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async () => {
    if (!assignEmail.trim()) return;
    setAssigning(true);
    try {
      const member = board?.members?.find((m) => m.user?.email === assignEmail.trim());
      if (!member) {
        setError('User not found in board members');
        setAssigning(false);
        return;
      }
      const { data } = await api.put(`/cards/${card._id}/assign`, { userId: member.user._id });
      onCardUpdated(data);
      if (socket) socket.emit('card:update', { boardId, card: data });
      setAssignEmail('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign');
    } finally {
      setAssigning(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/cards/${card._id}`);
      onCardDeleted(card._id);
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const toggleLabel = (label) => {
    setEditLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  return (
    <>
      <Draggable draggableId={card._id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onClick={openModal}
            role="button"
            tabIndex={0}
            aria-label={`Card: ${card.title}`}
            onKeyDown={(e) => e.key === 'Enter' && openModal()}
            className={`bg-white rounded-lg shadow-sm p-3 mb-2 cursor-pointer hover:shadow-md transition select-none ${
              snapshot.isDragging ? 'shadow-lg rotate-1' : ''
            }`}
          >
            {card.labels?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2" aria-label="Labels">
                {card.labels.map((label) => (
                  <span
                    key={label}
                    className={`${LABEL_COLORS[label] || 'bg-gray-300'} h-2 w-8 rounded-full`}
                    title={label}
                    aria-label={label}
                  />
                ))}
              </div>
            )}

            <p className="text-sm text-gray-800 font-medium leading-snug">{card.title}</p>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                {card.dueDate && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      isPastDue(card.dueDate) ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                    }`}
                    aria-label={`Due ${formatDue(card.dueDate)}${isPastDue(card.dueDate) ? ', overdue' : ''}`}
                  >
                    {isPastDue(card.dueDate) ? '⚠ ' : ''}{formatDue(card.dueDate)}
                  </span>
                )}
                {card.description && (
                  <svg className="w-3.5 h-3.5 text-gray-400" aria-label="Has description" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                )}
              </div>
              {card.assignedTo?.length > 0 && (
                <div className="flex -space-x-1" aria-label={`Assigned to ${card.assignedTo.map((u) => u.name).join(', ')}`}>
                  {card.assignedTo.slice(0, 3).map((u, i) => (
                    <span
                      key={u._id || i}
                      title={u.name}
                      aria-hidden="true"
                      className={`${AVATAR_COLORS[i % AVATAR_COLORS.length]} text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border border-white`}
                    >
                      {getInitials(u.name || '?')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Draggable>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 px-4 py-10 overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Edit card: ${card.title}`}
            className="bg-gray-100 rounded-2xl shadow-xl w-full max-w-lg"
          >
            <div className="bg-white rounded-t-2xl p-5 border-b border-gray-200">
              <div className="flex items-start justify-between gap-3">
                <input
                  ref={firstFocusRef}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  aria-label="Card title"
                  aria-required="true"
                  className="text-gray-800 font-semibold text-base w-full bg-transparent focus:outline-none focus:bg-gray-50 rounded px-2 py-1 -mx-2"
                />
                <button
                  onClick={closeModal}
                  aria-label="Close modal"
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {error && (
                <div role="alert" className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-3 py-2 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor={`desc-${card._id}`} className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                  Description
                </label>
                <textarea
                  id={`desc-${card._id}`}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  placeholder="Add a description..."
                />
              </div>

              <div>
                <label htmlFor={`due-${card._id}`} className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                  Due Date
                </label>
                <input
                  id={`due-${card._id}`}
                  type="date"
                  value={editDue}
                  onChange={(e) => setEditDue(e.target.value)}
                  className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div>
                <p className="block text-xs font-semibold text-gray-500 uppercase mb-2">Labels</p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Label selection">
                  {Object.entries(LABEL_COLORS).map(([label, color]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleLabel(label)}
                      aria-pressed={editLabels.includes(label)}
                      aria-label={label}
                      className={`${color} text-white text-xs px-3 py-1 rounded-full capitalize transition ${
                        editLabels.includes(label) ? 'ring-2 ring-offset-1 ring-gray-500' : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor={`assign-${card._id}`} className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                  Assign Member
                </label>
                <div className="flex gap-2">
                  <input
                    id={`assign-${card._id}`}
                    type="email"
                    value={assignEmail}
                    onChange={(e) => setAssignEmail(e.target.value)}
                    placeholder="member@email.com"
                    className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <button
                    onClick={handleAssign}
                    disabled={assigning || !assignEmail.trim()}
                    className="bg-indigo-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-60"
                  >
                    {assigning ? '...' : 'Assign'}
                  </button>
                </div>
                {card.assignedTo?.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap" aria-label="Assigned members">
                    {card.assignedTo.map((u, i) => (
                      <span
                        key={u._id || i}
                        className="flex items-center gap-1 bg-white border border-gray-200 rounded-full px-2 py-0.5 text-xs text-gray-600"
                      >
                        <span
                          aria-hidden="true"
                          className={`${AVATAR_COLORS[i % AVATAR_COLORS.length]} text-white font-bold w-4 h-4 rounded-full flex items-center justify-center text-xs`}
                        >
                          {getInitials(u.name || '?')}
                        </span>
                        {u.name || u.email}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                {deleteConfirm ? (
                  <div className="flex gap-2 items-center">
                    <span className="text-sm text-red-600">Delete card?</span>
                    <button
                      onClick={handleDelete}
                      className="bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-700 transition"
                    >
                      Yes, delete
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(false)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    className="text-sm text-red-500 hover:text-red-700 transition"
                  >
                    Delete card
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TaskCard;
