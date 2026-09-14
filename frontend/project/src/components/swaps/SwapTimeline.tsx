const steps = ['Proposed', 'Confirmed', 'In progress', 'Completed'];
export default function SwapTimeline({ current = 0 }: { current?: number }) {
  return <div className="flex items-start">{steps.map((step, index) => <div key={step} className="flex flex-1 items-start last:flex-none"><div className="flex flex-col items-center"><span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${index <= current ? 'bg-primary-600 text-white' : 'bg-neutral-200 text-neutral-500'}`}>{index + 1}</span><span className="mt-2 whitespace-nowrap text-[10px] font-medium text-neutral-500">{step}</span></div>{index < steps.length - 1 && <span className={`mt-3 h-0.5 w-full ${index < current ? 'bg-primary-600' : 'bg-neutral-200'}`} />}</div>)}</div>;
}
