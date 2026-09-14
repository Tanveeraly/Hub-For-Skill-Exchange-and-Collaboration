import Card from '../ui/Card';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import SwapTimeline from './SwapTimeline';
interface SwapCardProps { swap: any; currentStep?: number; onAccept?: () => void; onReject?: () => void; onOpenChat?: () => void; }
export default function SwapCard({ swap, currentStep = 0, onAccept, onReject, onOpenChat }: SwapCardProps) {
  const partner = swap?.sender?.name || swap?.receiver?.name || swap?.partnerName || 'Skill partner';
  return <Card className="p-5"><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><Avatar name={partner} src={swap?.sender?.profile?.avatarUrl || swap?.receiver?.profile?.avatarUrl} /><div><h3 className="font-semibold">{partner}</h3><p className="text-sm text-neutral-500">{swap?.offeredSkill || 'Skill exchange'}</p></div></div><span className="rounded-full bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700">{swap?.status || 'PENDING'}</span></div><div className="mt-6"><SwapTimeline current={currentStep} /></div><div className="mt-5 flex flex-wrap gap-2">{onAccept && <Button size="sm" onClick={onAccept}>Accept</Button>}{onReject && <Button size="sm" variant="danger" onClick={onReject}>Decline</Button>}{onOpenChat && <Button size="sm" variant="ghost" onClick={onOpenChat}>Open chat</Button>}</div></Card>;
}
