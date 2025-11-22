# Migracja do Microsoft Fluent 2.0 Design System

## Przegląd zmian

Aplikacja 10xCards została zaktualizowana aby wykorzystywać Microsoft Fluent 2.0 Design System, zapewniając nowoczesny, dostępny i spójny interfejs użytkownika.

## Wprowadzone zmiany

### 1. Nowe pliki

#### `src/styles/fluent-tokens.css`
Kompletny zestaw tokenów projektowych Fluent 2.0:
- **Kolory**: neutralne, brandowe, statusów (sukces, ostrzeżenie, błąd, info)
- **Typografia**: rozmiary, wagi, wysokości linii, rodziny czcionek
- **Odstępy**: system 4px dla poziomych i pionowych odstępów
- **Promienie zaokrągleń**: od małych (2px) do okrągłych (50%)
- **Cienie**: 6 poziomów elevacji (2px do 64px)
- **Animacje**: czas trwania i krzywe przejść
- **Tryb ciemny**: pełne wsparcie dla wszystkich tokenów
- **Wysoki kontrast**: automatyczne dostosowanie dla lepszej dostępności
- **Reduced motion**: respektowanie preferencji użytkownika

### 2. Zaktualizowane pliki

#### `src/styles/global.css`
- Import tokenów Fluent 2.0
- Mapowanie tokenów na zmienne Shadcn/ui dla kompatybilności
- Nowa skala typograficzna (h1-h6, p, small)
- Style focus zgodne z Fluent 2.0
- Utility classes dla elevacji, typografii, odstępów
- Kolory statusów i stany interakcji

#### `src/components/FlashcardItem.tsx`
- Zastąpienie kolorów Tailwind tokenami statusów Fluent 2.0
- Użycie semantycznych klas kolorów (bg-success, text-danger, etc.)

#### `src/components/Welcome.astro`
- Kompletna transformacja na tokeny Fluent 2.0
- Użycie nowych utility classes (elevation-*, text-*, space-fluent-*)
- Semantyczne kolory dla różnych typów informacji

## Nowe utility classes

### Elevacje (cienie)
```css
.elevation-2   /* Subtelny cień */
.elevation-4   /* Lekki cień */
.elevation-8   /* Średni cień */
.elevation-16  /* Wyraźny cień */
.elevation-28  /* Silny cień */
.elevation-64  /* Bardzo silny cień */
```

### Typografia
```css
.text-caption      /* 12px - małe etykiety */
.text-body         /* 14px - podstawowy tekst */
.text-body-strong  /* 14px bold - wyróżniony tekst */
.text-subtitle     /* 16px - podtytuły */
.text-title        /* 20px - tytuły */
.text-large-title  /* 24px - duże tytuły */
.text-display      /* 28px - nagłówki */
```

### Odstępy Fluent
```css
.space-fluent-xs   /* 4px */
.space-fluent-s    /* 8px */
.space-fluent-m    /* 12px */
.space-fluent-l    /* 16px */
.space-fluent-xl   /* 20px */
.space-fluent-xxl  /* 24px */

/* Padding i margin z prefiksami p-fluent-* i m-fluent-* */
```

### Promienie zaokrągleń
```css
.rounded-fluent-sm  /* 2px */
.rounded-fluent-md  /* 4px */
.rounded-fluent-lg  /* 6px */
.rounded-fluent-xl  /* 8px */
```

### Kolory statusów
```css
.text-success, .bg-success, .border-success
.text-warning, .bg-warning, .border-warning  
.text-danger, .bg-danger, .border-danger
.text-info, .bg-info, .border-info
.text-brand, .bg-brand, .border-brand
```

### Interakcje
```css
.hover-lift  /* Efekt unoszenia przy hover */
```

## Funkcje dostępności

### Automatyczne wsparcie
- **Tryb wysokiego kontrastu**: `@media (prefers-contrast: high)`
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)`
- **Focus styles**: Zgodne z Fluent 2.0 (outline + offset)
- **Kontrast kolorów**: Wszystkie kombinacje spełniają WCAG 2.1 AA

### Tryby kolorystyczne
- **Jasny**: Domyślne tokeny
- **Ciemny**: Automatyczne przełączanie z klasą `.dark`
- **Wysoki kontrast**: Automatyczne wykrywanie preferencji systemu

## Tokeny CSS

Wszystkie tokeny są dostępne jako zmienne CSS:

```css
/* Przykłady użycia */
background-color: var(--colorNeutralBackground1);
color: var(--colorBrandForeground1);
border-radius: var(--borderRadiusMedium);
box-shadow: var(--shadow8);
font-size: var(--fontSizeBase400);
gap: var(--spacingHorizontalM);
```

## Kompatybilność

### Shadcn/ui
Wszystkie komponenty Shadcn/ui działają bez zmian dzięki mapowaniu tokenów w `global.css`.

### Tailwind CSS
Nowe utility classes współpracują z istniejącymi klasami Tailwind.

### Responsywność
Wszystkie tokeny działają z prefiksami responsywnymi Tailwind (`sm:`, `md:`, `lg:`, etc.).

## Najlepsze praktyki

### Używaj tokenów semantycznych
```css
/* ✅ Dobrze */
.success-message {
  background-color: var(--colorStatusSuccessBackground1);
  color: var(--colorStatusSuccessForeground1);
}

/* ❌ Unikaj */
.success-message {
  background-color: #f3f9f1;
  color: #107c10;
}
```

### Wykorzystuj utility classes
```html
<!-- ✅ Dobrze -->
<div class="elevation-8 rounded-fluent-lg p-fluent-m">

<!-- ❌ Unikaj -->
<div style="box-shadow: 0px 4px 8px rgba(0,0,0,0.14); border-radius: 6px; padding: 12px;">
```

### Respektuj hierarchię typograficzną
```html
<h1 class="text-display">Główny nagłówek</h1>
<h2 class="text-large-title">Podtytuł</h2>
<p class="text-body">Treść artykułu</p>
<small class="text-caption">Dodatkowe informacje</small>
```

## Testowanie

Aplikacja została przetestowana pod kątem:
- ✅ Kontrastu kolorów (WCAG 2.1 AA)
- ✅ Trybu ciemnego
- ✅ Wysokiego kontrastu
- ✅ Reduced motion
- ✅ Responsywności
- ✅ Kompatybilności z istniejącymi komponentami

## Dalszy rozwój

Przy dodawaniu nowych komponentów:
1. Używaj tokenów Fluent 2.0 zamiast wartości bezpośrednich
2. Testuj w trybie ciemnym i wysokim kontraście
3. Sprawdzaj dostępność (kontrast, focus, ARIA)
4. Wykorzystuj utility classes dla spójności

## Dokumentacja

- [Microsoft Fluent 2.0 Design Tokens](https://fluent2.microsoft.design/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
