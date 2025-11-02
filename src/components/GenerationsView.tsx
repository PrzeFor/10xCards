import React, { useState } from 'react';
import { toast } from 'sonner';
import { GenerationForm } from './GenerationForm.tsx';
import { FlashcardList } from './FlashcardList.tsx';
import { LoadingSkeleton } from './LoadingSkeleton.tsx';
import { useGenerateFlashcards } from '../lib/hooks/useGenerateFlashcards.ts';
import { useSaveFlashcards } from '../lib/hooks/useSaveFlashcards.ts';
import type { FlashcardProposalViewModel } from '../types/viewModels';
import type { CreateGenerationResponseDto } from '../types';

export default function GenerationsView() {
  const [sourceText, setSourceText] = useState('');
  const [proposals, setProposals] = useState<FlashcardProposalViewModel[]>([]);
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { generate, isLoading: isGenerating, error: generateError } = useGenerateFlashcards();
  const { saveSelected, isSaving, error: saveError } = useSaveFlashcards();

  const handleGenerate = async (text: string) => {
    try {
      const response: CreateGenerationResponseDto = await generate(text);
      
      // Convert proposals to view models
      const viewModels: FlashcardProposalViewModel[] = response.flashcards_proposals.map(proposal => ({
        ...proposal,
        isSelected: false,
        status: 'pending' as const,
      }));
      
      setProposals(viewModels);
      setCurrentGenerationId(response.id);
      setSourceText('');
    } catch (error) {
      console.error('Generation failed:', error);
    }
  };

  const handleToggleSelect = (id: string) => {
    setProposals(prev => prev.map(p => 
      p.id === id ? { ...p, isSelected: !p.isSelected } : p
    ));
  };

  const handleAccept = (id: string) => {
    setProposals(prev => prev.map(p => 
      p.id === id ? { ...p, status: 'accepted' as const, isSelected: true } : p
    ));
  };

  const handleReject = (id: string) => {
    setProposals(prev => prev.map(p => 
      p.id === id ? { ...p, status: 'rejected' as const, isSelected: false } : p
    ));
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
  };

  const handleSaveEdit = (id: string, front: string, back: string) => {
    setProposals(prev => prev.map(p => 
      p.id === id ? { 
        ...p, 
        status: 'edited' as const, 
        editedFront: front, 
        editedBack: back,
        isSelected: true 
      } : p
    ));
    setEditingId(null);
    
    toast.success('Fiszka została edytowana', {
      description: 'Zmiany zostały zapisane lokalnie. Pamiętaj o zapisaniu zaznaczonych fiszek.',
    });
  };

  const handleSelectAll = () => {
    const allSelected = proposals.every(p => p.isSelected);
    setProposals(prev => prev.map(p => ({ ...p, isSelected: !allSelected })));
  };

  const handleAcceptAll = () => {
    setProposals(prev => prev.map(p => ({ 
      ...p, 
      status: 'accepted' as const, 
      isSelected: true 
    })));
  };

  const handleRejectAll = () => {
    setProposals(prev => prev.map(p => ({ 
      ...p, 
      status: 'rejected' as const, 
      isSelected: false 
    })));
  };

  const handleSaveSelected = async () => {
    if (!currentGenerationId) return;
    
    const selectedProposals = proposals.filter(p => p.isSelected);
    if (selectedProposals.length === 0) return;

    try {
      await saveSelected(selectedProposals, currentGenerationId);
      
      // Remove saved proposals from the list
      setProposals(prev => prev.filter(p => !p.isSelected));
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const selectedCount = proposals.filter(p => p.isSelected).length;

  return (
    <div className="space-y-8">
      <GenerationForm
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        errorMessage={generateError || undefined}
        initialValue={sourceText}
        onValueChange={setSourceText}
      />

      {isGenerating && <LoadingSkeleton />}

      {proposals.length > 0 && !isGenerating && (
        <FlashcardList
          proposals={proposals}
          selectedCount={selectedCount}
          onToggleSelect={handleToggleSelect}
          onAccept={handleAccept}
          onReject={handleReject}
          onEdit={handleEdit}
          onSelectAll={handleSelectAll}
          onAcceptAll={handleAcceptAll}
          onRejectAll={handleRejectAll}
          onSaveSelected={handleSaveSelected}
          editingId={editingId}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={() => setEditingId(null)}
          isSaving={isSaving}
          saveError={saveError || undefined}
        />
      )}
    </div>
  );
}
