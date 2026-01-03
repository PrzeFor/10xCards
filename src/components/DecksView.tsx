import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { DecksList } from './DecksList';
import { DeckFormModal } from './DeckFormModal';
import { DeleteDeckModal } from './DeleteDeckModal';
import { useDecks } from '../lib/hooks/useDecks';
import { useDeckMutations } from '../lib/hooks/useDeckMutations';
import type { DeckWithStatsDto } from '../types';
import { Plus } from 'lucide-react';

interface DeckFormData {
  name: string;
  description?: string;
  color?: string;
}

type ModalState =
  | { type: 'closed' }
  | { type: 'create' }
  | { type: 'edit'; deck: DeckWithStatsDto }
  | { type: 'delete'; deck: DeckWithStatsDto };

export function DecksView() {
  const { decks, loading, error, refetch } = useDecks();
  const { createDeck, updateDeck, deleteDeck } = useDeckMutations();
  const [modalState, setModalState] = useState<ModalState>({ type: 'closed' });

  // Modal handlers
  const openCreateModal = () => setModalState({ type: 'create' });
  const openEditModal = (deck: DeckWithStatsDto) => setModalState({ type: 'edit', deck });
  const openDeleteModal = (deck: DeckWithStatsDto) => setModalState({ type: 'delete', deck });
  const closeModal = () => setModalState({ type: 'closed' });

  // Create deck handler
  const handleCreateSave = async (data: DeckFormData) => {
    try {
      await createDeck(data);
      closeModal();
      await refetch();
      toast.success('Zestaw został utworzony');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Wystąpił błąd podczas tworzenia zestawu';
      toast.error(message);
      throw error;
    }
  };

  // Edit deck handler
  const handleEditSave = async (data: DeckFormData) => {
    if (modalState.type !== 'edit') return;

    try {
      await updateDeck(modalState.deck.id, data);
      closeModal();
      await refetch();
      toast.success('Zestaw został zaktualizowany');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Wystąpił błąd podczas aktualizacji zestawu';
      toast.error(message);
      throw error;
    }
  };

  // Delete deck handler
  const handleDeleteConfirm = async (deckId: string) => {
    try {
      await deleteDeck(deckId);
      closeModal();
      await refetch();
      toast.success('Zestaw został usunięty');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Wystąpił błąd podczas usuwania zestawu';
      toast.error(message);
      throw error;
    }
  };

  // Select deck handler - redirect to flashcards with filter
  const handleSelectDeck = (deckId: string) => {
    window.location.href = `/flashcards?filter[deck_id]=${deckId}`;
  };

  // Show error toast if fetch failed
  React.useEffect(() => {
    if (error) {
      toast.error(error, {
        action: {
          label: 'Spróbuj ponownie',
          onClick: () => refetch(),
        },
      });
    }
  }, [error, refetch]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Zestawy</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Organizuj swoje fiszki w kategorie i ucz się efektywniej
          </p>
        </div>
        <Button onClick={openCreateModal} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Nowy zestaw
        </Button>
      </div>

      {/* Decks list */}
      <DecksList
        decks={decks}
        loading={loading}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        onSelect={handleSelectDeck}
      />

      {/* Create/Edit Modal */}
      <DeckFormModal
        isOpen={modalState.type === 'create' || modalState.type === 'edit'}
        mode={modalState.type === 'edit' ? 'edit' : 'create'}
        initialData={
          modalState.type === 'edit'
            ? {
                name: modalState.deck.name,
                description: modalState.deck.description || undefined,
                color: modalState.deck.color || undefined,
              }
            : undefined
        }
        onSave={modalState.type === 'create' ? handleCreateSave : handleEditSave}
        onClose={closeModal}
      />

      {/* Delete Modal */}
      <DeleteDeckModal
        isOpen={modalState.type === 'delete'}
        deck={modalState.type === 'delete' ? modalState.deck : null}
        onConfirm={handleDeleteConfirm}
        onClose={closeModal}
      />
    </div>
  );
}

