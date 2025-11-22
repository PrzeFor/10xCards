import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('should merge class names', () => {
      const result = cn('class1', 'class2');
      
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('should handle conditional class names', () => {
      const isActive = true;
      const result = cn('base-class', isActive && 'active-class');
      
      expect(result).toContain('base-class');
      expect(result).toContain('active-class');
    });

    it('should ignore falsy values', () => {
      const result = cn('class1', false, null, undefined, 'class2');
      
      expect(result).toContain('class1');
      expect(result).toContain('class2');
      expect(result).not.toContain('false');
      expect(result).not.toContain('null');
      expect(result).not.toContain('undefined');
    });

    it('should handle Tailwind class conflicts', () => {
      // tailwind-merge should resolve conflicts, keeping the last one
      const result = cn('px-2', 'px-4');
      
      // Should only contain px-4, not px-2
      expect(result).not.toContain('px-2');
      expect(result).toContain('px-4');
    });

    it('should handle empty input', () => {
      const result = cn();
      
      expect(result).toBe('');
    });

    it('should handle array of class names', () => {
      const result = cn(['class1', 'class2']);
      
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('should handle objects with boolean values', () => {
      const result = cn({
        'class1': true,
        'class2': false,
        'class3': true,
      });
      
      expect(result).toContain('class1');
      expect(result).not.toContain('class2');
      expect(result).toContain('class3');
    });
  });
});

