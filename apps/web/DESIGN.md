# Academic Serenity — Design System

Scilab visual language: calm, intelligent, minimal, premium, reading-focused.

> "Organized thoughts on premium paper."

## References

- Notion — information hierarchy
- Linear — polished interactions
- Medium — comfortable reading
- Modern university/research platforms

**Avoid:** neon colors, heavy gradients, glassmorphism, heavy shadows, pill buttons, Material-style colorful UI.

---

## Colors

| Token                    | Value                    | Usage                                  |
| ------------------------ | ------------------------ | -------------------------------------- |
| `--primary-color`        | `#D3AB9E`                | Buttons, active nav, selected states   |
| `--secondary-color`      | `#3AC9C1`                | Progress, charts, success metrics only |
| `--surface-color`        | `#FFFFFF`                | Cards, panels                          |
| `--background-color`     | `#F9F9FA`                | Page background                        |
| `--surface-raised-color` | `#F3F3F4`                | Inputs, elevated areas                 |
| `--surface-muted-color`  | `#EDEEEF`                | Subtle sections                        |
| `--border-color`         | `rgba(211,171,158,0.15)` | Soft borders                           |
| `--tag-text-color`       | `#5C3F35`                | Tags, links, accents                   |

Edit: `src/styles/color.css`

---

## Typography

| Role     | Font              | Weight                 |
| -------- | ----------------- | ---------------------- |
| Headings | Libre Caslon Text | 400 (never bold-heavy) |
| Body     | Manrope           | 400–500                |

- Use class `font-heading` for titles
- Edit: `src/styles/fonts.css`

---

## Layout

- 12-column mental model
- Max width: `1280px` (`--layout-max-width`)
- Gutters: `24px` (`--layout-gutter`)
- Component: `PageContainer`

---

## Spacing (8px scale)

`8 · 16 · 24 · 32 · 40 · 48 · 64`

Edit: `src/styles/spacing.css`

---

## Radius

| Element          | Value |
| ---------------- | ----- |
| Inputs / Buttons | `4px` |
| Cards            | `8px` |

---

## Shadows

```css
--shadow-ambient: 0 4px 20px rgba(211, 171, 158, 0.05);
```

Use `shadow-ambient` class only. No `shadow-lg`.

---

## Components

| Component    | Location                                        |
| ------------ | ----------------------------------------------- |
| Button       | `shared/components/ui/button.tsx`               |
| Input        | `shared/components/ui/input.tsx`                |
| Card         | `shared/components/ui/card.tsx`                 |
| Table        | `shared/components/ui/table.tsx`                |
| Badge / Tags | `shared/components/ui/badge.tsx`                |
| Progress     | `shared/components/ui/progress.tsx` (teal fill) |
| Admin layout | `shared/components/layout/AdminShell.tsx`       |
| Page wrapper | `shared/components/layout/PageContainer.tsx`    |

---

## File structure

```
src/styles/
├── index.css      # entry
├── fonts.css      # font-family ★
├── color.css      # theme colors ★
├── spacing.css    # spacing & radius
├── theme.css      # Tailwind bridge + base
└── tailwind.css
```
