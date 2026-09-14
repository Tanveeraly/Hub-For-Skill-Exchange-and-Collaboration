interface TabsProps {
  items: { label: string; value: string; disabled?: boolean }[];
  active: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function Tabs({ items, active, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex gap-2 overflow-x-auto border-b border-neutral-200 ${className}`}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          disabled={item.disabled}
          onClick={() => !item.disabled && onChange(item.value)}
          className={`relative whitespace-nowrap px-3 py-2 text-sm font-medium transition ${active === item.value ? 'text-primary-600' : 'text-neutral-600 hover:text-neutral-900'} ${item.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          {item.label}
          {active === item.value && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary-600" />}
        </button>
      ))}
    </div>
  );
}
