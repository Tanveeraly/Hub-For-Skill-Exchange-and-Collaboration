import { Plus, X } from 'lucide-react';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface Skill { id: number; skillName: string; expertiseLevel: string; }
interface ProfileSkillsProps { skills: Skill[]; onAdd?: () => void; onRemove?: (id: number) => void; }

export default function ProfileSkills({ skills, onAdd, onRemove }: ProfileSkillsProps) {
  return <Card className="p-6"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">Skills</h2><p className="mt-1 text-sm text-neutral-500">Showcase the skills you can exchange with others.</p></div>{onAdd && <Button size="sm" onClick={onAdd}><Plus className="mr-1 h-4 w-4" />Add skill</Button>}</div><div className="mt-5 flex flex-wrap gap-2">{skills.map((skill) => <span key={skill.id} className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-sm text-primary-700"><span>{skill.skillName}</span><Badge tone="neutral">{skill.expertiseLevel}</Badge>{onRemove && <button onClick={() => onRemove(skill.id)} aria-label={`Remove ${skill.skillName}`}><X className="h-3.5 w-3.5" /></button>}</span>)}</div>{skills.length === 0 && <p className="mt-5 text-sm text-neutral-500">No skills added yet.</p>}</Card>;
}
