interface StatusBadgeProps {
  label: string;
  map: Record<string, string>;
  size?: 'sm' | 'md';
  className?: string;
}

export default function StatusBadge({ label, map, size = 'sm', className = '' }: StatusBadgeProps) {
  const sizeClasses = size === 'md' ? 'px-3 py-1 text-xs font-medium' : 'px-2 py-0.5 text-xs';
  return (
    <span className={`inline-block ${sizeClasses} rounded-full ${map[label] ?? 'bg-gray-50 text-gray-600 border border-gray-200'} ${className}`}>
      {label}
    </span>
  );
}