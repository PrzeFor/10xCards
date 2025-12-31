import { ExitButton } from './ExitButton';
import { ProgressBar } from './ProgressBar';

interface FullscreenWrapperProps {
  children: React.ReactNode;
  onExit: () => void;
  currentIndex: number;
  totalCards: number;
  requireExitConfirmation?: boolean;
}

/**
 * Wrapper component for fullscreen session view
 * Provides header with exit button and progress bar, plus centered content area
 */
export function FullscreenWrapper({
  children,
  onExit,
  currentIndex,
  totalCards,
  requireExitConfirmation = true,
}: FullscreenWrapperProps) {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border p-4">
        <ExitButton onExit={onExit} requireConfirmation={requireExitConfirmation} />
        
        <div className="flex-1 px-8">
          <ProgressBar current={currentIndex} total={totalCards} />
        </div>
        
        {/* Spacer for symmetry */}
        <div className="w-10" />
      </header>

      {/* Main content area */}
      <main className="flex flex-1 items-center justify-center p-4">
        {children}
      </main>
    </div>
  );
}

