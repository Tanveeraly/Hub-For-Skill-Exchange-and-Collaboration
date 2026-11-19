import { ArrowLeftRight } from 'lucide-react';

/** Plain wordmark: a small swap mark next to the product name. Crisp at any size. */
export default function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-600 text-white">
        <ArrowLeftRight className="h-4 w-4" strokeWidth={2.5} />
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-neutral-900">HubForSkills</span>
    </span>
  );
}
