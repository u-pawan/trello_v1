import { DragDropContext } from '@hello-pangea/dnd';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Column from './Column';

const KanbanBoard = ({ boardId, lists, setLists, onAddList, socket, board }) => {
  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceList = lists.find((l) => l._id === source.droppableId);
    const destList = lists.find((l) => l._id === destination.droppableId);
    if (!sourceList || !destList) return;

    // Snapshot for rollback
    const previousLists = lists.map((l) => ({ ...l, cards: [...l.cards] }));

    const sourceCards = [...sourceList.cards];
    const destCards =
      source.droppableId === destination.droppableId ? sourceCards : [...destList.cards];

    const [movedCard] = sourceCards.splice(source.index, 1);
    if (!movedCard) return;

    if (source.droppableId === destination.droppableId) {
      sourceCards.splice(destination.index, 0, movedCard);
      setLists((prev) =>
        prev.map((l) =>
          l._id === sourceList._id
            ? { ...l, cards: sourceCards.map((c, i) => ({ ...c, position: i })) }
            : l
        )
      );
    } else {
      destCards.splice(destination.index, 0, { ...movedCard, list: destList._id });
      setLists((prev) =>
        prev.map((l) => {
          if (l._id === sourceList._id)
            return { ...l, cards: sourceCards.map((c, i) => ({ ...c, position: i })) };
          if (l._id === destList._id)
            return { ...l, cards: destCards.map((c, i) => ({ ...c, position: i })) };
          return l;
        })
      );

      try {
        await api.put(`/cards/${draggableId}/move`, {
          sourceListId: source.droppableId,
          destListId: destination.droppableId,
          position: destination.index,
        });

        if (socket) {
          socket.emit('card:move', {
            boardId,
            cardId: draggableId,
            sourceListId: source.droppableId,
            destListId: destination.droppableId,
            position: destination.index,
          });
        }
      } catch (err) {
        // Revert to the exact snapshot taken before drag
        setLists(previousLists);
        toast.error(err.response?.data?.message || 'Failed to move card');
      }
    }
  };

  const handleAddListSubmit = async (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    await onAddList(newListTitle.trim());
    setNewListTitle('');
    setAddingList(false);
  };

  return (
    <div className="h-full overflow-x-auto">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 p-4 h-full items-start">
          {lists.map((list) => (
            <Column
              key={list._id}
              list={list}
              boardId={boardId}
              setLists={setLists}
              socket={socket}
              board={board}
            />
          ))}

          {/* Add List */}
          <div className="flex-shrink-0 w-72">
            {addingList ? (
              <form
                onSubmit={handleAddListSubmit}
                className="bg-white/20 backdrop-blur-sm rounded-xl p-3"
              >
                <input
                  autoFocus
                  type="text"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  placeholder="List title..."
                  className="w-full bg-white rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-white mb-2"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-white text-indigo-700 font-semibold text-sm px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition"
                  >
                    Add List
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAddingList(false); setNewListTitle(''); }}
                    className="text-white/80 hover:text-white text-sm px-2 py-1.5"
                  >
                    ✕
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setAddingList(true)}
                className="w-full bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-3 rounded-xl transition text-left"
              >
                + Add a list
              </button>
            )}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;
