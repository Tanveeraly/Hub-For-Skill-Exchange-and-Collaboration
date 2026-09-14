import { Search } from 'lucide-react';

interface SearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  name?: string;
}

export default function SearchInput({ value, onChange, placeholder = 'Search skills, people…', className = '', name }: SearchInputProps) {
  return (
    <div className={`flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-600 ${className}`}>
      <Search className="h-4 w-4 text-neutral-500" />
      <input
        name={name}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
        placeholder={placeholder}
      />
    </div>
  );
}
