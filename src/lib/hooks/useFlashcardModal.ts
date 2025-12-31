import { useState, useCallback } from 'react';
import type { FlashcardDto } from '../../types';
import type { ModalState } from '../../types/viewModels';

interface UseFlashcardModalReturn {
  modalState: ModalState;
  openCreateModal: () => void;
  openEditModal: (flashcard: FlashcardDto) => void;
  openDeleteModal: (flashcard: FlashcardDto) => void;
  closeModal: () => void;
}

/**
 * Hook zarządzający stanem modali (otwieranie, zamykanie, przekazywanie danych)
 */
export function useFlashcardModal(): UseFlashcardModalReturn {
  const [modalState, setModalState] = useState<ModalState>({ type: null });

  const openCreateModal = useCallback(() => {
    setModalState({ type: 'create' });
  }, []);

  const openEditModal = useCallback((flashcard: FlashcardDto) => {
    setModalState({ type: 'edit', flashcard });
  }, []);

  const openDeleteModal = useCallback((flashcard: FlashcardDto) => {
    setModalState({ type: 'delete', flashcard });
  }, []);

  const closeModal = useCallback(() => {
    setModalState({ type: null });
  }, []);

  return {
    modalState,
    openCreateModal,
    openEditModal,
    openDeleteModal,
    closeModal,
  };
}

