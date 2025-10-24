# Components

This directory contains reusable React components used throughout the application.

## Structure

Organize components by feature or type:

```
components/
├── ui/           # UI components (buttons, cards, inputs, etc.)
├── layout/       # Layout components (header, footer, sidebar, etc.)
└── features/     # Feature-specific components
```

## Example Component

```tsx
// components/ui/Button.tsx
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export default function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded ${
        variant === 'primary' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
      }`}
    >
      {children}
    </button>
  );
}
```
