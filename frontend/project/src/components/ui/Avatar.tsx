interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
  verified?: boolean;
  className?: string;
}

const sizeClasses: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

export default function Avatar({ src, alt = 'Avatar', name = 'U', size = 'md', online = false, verified = false, className = '' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={`relative inline-block ${className}`}>
      <div className={`flex items-center justify-center overflow-hidden rounded-full border border-white bg-primary-100 font-semibold text-primary-700 ${sizeClasses[size]}`}>
        {src ? <img src={src} alt={alt} className="h-full w-full object-cover" /> : initials}
      </div>
      {online && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500" />}
      {verified && (
        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-white bg-primary-600 text-[8px] text-white">
          ✓
        </span>
      )}
    </div>
  );
}
