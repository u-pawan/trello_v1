import { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import api from '../../api/axios';
import TaskCard from './TaskCard';
import AddCardForm from './AddCardForm';

const Column = ({ list, boardId, setLists, socket, board }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(list.title);
  const [showCardForm, setShowCardForm] = useState(false);

  const handleTitleSave = async () => {
    setIsEditingTitle(false);
    if (titleInput.trim() === list.title) return;
    try {
      await api.put(`/lists/${list._id}`, { title: titleInput.trim() });
      setLists((prev) =>
        prev.map((l) =>
          l._id === list._id ? { ...l, title: titleInput.trim() } : l
        )
      );
    } catch (err) {
      setTitleInput(list.title);
      console.error('Failed to update list title:', err);
    }
  };

  const handleCardAdded = (card) => {
    setLists((prev) =>
      prev.map((l) =>
        l._id === list._id ? { ...l, cards: [...l.cards, card] } : l
      )
    );
    if (socket) {
      socket.emit('card:create', { boardId, card });
    }
  };

  const handleCardUpdated = (updatedCard) => {
    setLists((prev) =>
      prev.map((l) =>
        l._id === list._id
          ? {
              ...l,
              cards: l.cards.map((c) =>
                c._id === updatedCard._id ? updatedCard : c
              ),
            }
          : l
      )
    );
  };

  const handleCardDeleted = (cardId) => {
    setLists((prev) =>
      prev.map((l) =>
        l._id === list._id
          ? { ...l, cards: l.cards.filter((c) => c._id !== cardId) }
          : l
      )
    );
  };

  return (
    <div className="flex-shrink-0 w-72 bg-gray-100 rounded-xl flex flex-col max-h-full">
      {/* Header */}
      <div className="px-3 pt-3 pb-2">
        {isEditingTitle ? (
          <input
            autoFocus
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSave();
              if (e.key === 'Escape') {
                setTitleInput(list.title);
                setIsEditingTitle(false);
              }
            }}
            className="w-full bg-white border border-indigo-300 rounded px-2 py-1 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        ) : (
          <h3
            className="font-semibold text-gray-700 text-sm px-1 cursor-pointer hover:bg-white/60 rounded py-1"
            onDoubleClick={() => setIsEditingTitle(true)}
            title="Double-click to edit"
          >
            {list.title}
            <span className="ml-2 text-gray-400 font-normal text-xs">
              {list.cards.length}
            </span>
          </h3>
        )}
      </div>

      {/* Cards */}
      <Droppable droppableId={list._id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto px-2 pb-1 min-h-[2px] transition-colors ${
              snapshot.isDraggingOver ? 'bg-indigo-50' : ''
            }`}
          >
            {list.cards.map((card, index) => (
              <TaskCard
                key={card._id}
                card={card}
                index={index}
                listId={list._id}
                boardId={boardId}
                board={board}
                onCardUpdated={handleCardUpdated}
                onCardDeleted={handleCardDeleted}
                socket={socket}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add card */}
      <div className="px-2 pb-2">
        <AddCardForm
          listId={list._id}
          boardId={boardId}
          onCardAdded={handleCardAdded}
          show={showCardForm}
          setShow={setShowCardForm}
        />
      </div>
    </div>
  );
};

export default Column;
