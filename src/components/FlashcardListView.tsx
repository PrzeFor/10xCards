import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { FilterBar } from './FilterBar';
import { FlashcardList } from './FlashcardList';
import { Pagination } from './Pagination';
import { FlashcardFormModal } from './FlashcardFormModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { SessionStartModal } from './SessionStartModal';
import { useFlashcards } from '../lib/hooks/useFlashcards';
import { useFlashcardMutations } from '../lib/hooks/useFlashcardMutations';
import { useFlashcardModal } from '../lib/hooks/useFlashcardModal';
import { useDecks } from '../lib/hooks/useDecks';
import {
  getDefaultFilters,
  getInitialPagination,
  calculateTotalPages,
} from '../types/viewModels';
import type { FlashcardFilters, PaginationState, FlashcardFormData } from '../types/viewModels';
import { PlayCircle } from 'lucide-react';

interface FlashcardListViewProps {
  message?: string | null;
  dueCount?: number;
}

/**
 * Główny kontener React zarządzający widokiem fiszek
 */
export function FlashcardListView({ message, dueCount = 0 }: FlashcardListViewProps) {
  const [filters, setFilters] = useState<FlashcardFilters>(getDefaultFilters());
  const [pagination, setPagination] = useState<PaginationState>(getInitialPagination());
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);

  // Custom hooks
  const { flashcards, loading, error, total, refetch } = useFlashcards({ filters, pagination });
  const { createFlashcard, updateFlashcard, deleteFlashcard } = useFlashcardMutations();
  const { modalState, openCreateModal, openEditModal, openDeleteModal, closeModal } =
    useFlashcardModal();
  const { decks } = useDecks();

  // Parse URL params for initial filter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const deckIdParam = urlParams.get('filter[deck_id]');
    if (deckIdParam) {
      setFilters((prev) => ({ ...prev, deckId: deckIdParam }));
    }
  }, []);

  // Aktualizuj totalPages gdy zmieni się total lub limit
  useEffect(() => {
    const totalPages = calculateTotalPages(total, pagination.limit);
    setPagination((prev) => ({ ...prev, total, totalPages }));
  }, [total, pagination.limit]);

  // Handler: zmiana filtrów
  const handleFilterChange = (newFilters: FlashcardFilters) => {
    setFilters(newFilters);
    // Reset paginacji do strony 1
    setPagination((prev) => ({
      ...prev,
      currentPage: 1,
      offset: 0,
    }));
  };

  // Handler: zmiana strony
  const handlePageChange = (page: number) => {
    const newOffset = (page - 1) * pagination.limit;
    setPagination((prev) => ({
      ...prev,
      currentPage: page,
      offset: newOffset,
    }));
    
    // Scroll do góry strony
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler: tworzenie nowej fiszki
  const handleCreateSave = async (data: FlashcardFormData) => {
    try {
      await createFlashcard(data);
      closeModal();
      await refetch();
      toast.success('Fiszka została utworzona');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Wystąpił błąd podczas tworzenia fiszki';
      toast.error(message);
    }
  };

  // Handler: edycja fiszki
  const handleEditSave = async (data: FlashcardFormData) => {
    if (!modalState.flashcard) return;

    try {
      await updateFlashcard(modalState.flashcard.id, data, modalState.flashcard);
      closeModal();
      await refetch();
      toast.success('Fiszka została zaktualizowana');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Wystąpił błąd podczas aktualizacji fiszki';
      toast.error(message);
    }
  };

  // Handler: usunięcie fiszki
  const handleDeleteConfirm = async (id: string) => {
    try {
      await deleteFlashcard(id);
      closeModal();
      await refetch();
      toast.success('Fiszka została usunięta');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Wystąpił błąd podczas usuwania fiszki';
      toast.error(message);
    }
  };

  // Wyświetl błąd globalny jeśli wystąpił
  useEffect(() => {
    if (error) {
      toast.error(error, {
        action: {
          label: 'Spróbuj ponownie',
          onClick: () => refetch(),
        },
      });
    }
  }, [error, refetch]);

  // Obsługa komunikatów z query params (np. po zakończeniu sesji)
  useEffect(() => {
    if (message === 'no_cards_due') {
      toast.info('Nie masz fiszek zaplanowanych do powtórki', {
        description: 'Wszystkie fiszki są aktualne. Wróć później!',
      });
    } else if (message === 'session_error') {
      toast.error('Wystąpił błąd podczas tworzenia sesji', {
        description: 'Spróbuj ponownie za chwilę.',
      });
    } else if (message === 'session_completed') {
      toast.success('Sesja zakończona pomyślnie!', {
        description: 'Gratulacje! Twoje fiszki zostały zaktualizowane.',
      });
    } else if (message === 'start_session') {
      // Automatycznie otwórz modal gdy przekierowano z Welcome
      setIsSessionModalOpen(true);
      // Wyczyść URL bez przeładowania strony
      window.history.replaceState({}, '', '/flashcards');
    }
  }, [message]);

  // Sprawdź localStorage przy starcie (dla smooth UX bez migania)
  useEffect(() => {
    const shouldOpenModal = localStorage.getItem('openSessionModal');
    if (shouldOpenModal === 'true') {
      localStorage.removeItem('openSessionModal');
      setIsSessionModalOpen(true);
    }

    // Nasłuchuj na event z vanilla JS (dla linków w menu)
    const handleOpenModal = () => {
      setIsSessionModalOpen(true);
      localStorage.removeItem('openSessionModal');
    };

    window.addEventListener('openSessionModal', handleOpenModal);
    
    return () => {
      window.removeEventListener('openSessionModal', handleOpenModal);
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Nagłówek strony */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Moje fiszki</h1>
          {dueCount > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-semibold text-primary">{dueCount}</span> fiszek czeka na
              powtórkę
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsSessionModalOpen(true)} size="lg" variant="default">
            <PlayCircle className="mr-2 h-5 w-5" />
            Rozpocznij sesję
          </Button>
          <Button onClick={openCreateModal} size="lg" variant="outline">
            Nowa fiszka
          </Button>
        </div>
      </div>

      {/* Pasek filtrów */}
      <FilterBar filters={filters} onFilterChange={handleFilterChange} decks={decks} />

      {/* Lista fiszek */}
      <FlashcardList
        flashcards={flashcards}
        loading={loading}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        onCreate={openCreateModal}
      />

      {/* Paginacja */}
      {!loading && flashcards.length > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Modal tworzenia/edycji */}
      <FlashcardFormModal
        isOpen={modalState.type === 'create' || modalState.type === 'edit'}
        mode={modalState.type === 'edit' ? 'edit' : 'create'}
        initialData={
          modalState.flashcard
            ? {
                front: modalState.flashcard.front,
                back: modalState.flashcard.back,
                deckId: modalState.flashcard.deck_id || undefined,
              }
            : undefined
        }
        onSave={modalState.type === 'create' ? handleCreateSave : handleEditSave}
        onClose={closeModal}
        decks={decks}
      />

      {/* Modal usuwania */}
      <DeleteConfirmationModal
        isOpen={modalState.type === 'delete'}
        flashcard={modalState.flashcard || null}
        onConfirm={handleDeleteConfirm}
        onClose={closeModal}
      />

      {/* Modal rozpoczęcia sesji */}
      <SessionStartModal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        totalFlashcards={total}
        dueFlashcards={dueCount}
        decks={decks}
      />
    </div>
  );
}

