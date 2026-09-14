import { MapPin, Pencil, ShieldCheck } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

interface ProfileHeaderProps {
  name: string;
  email?: string;
  avatarUrl?: string;
  coverUrl?: string;
  location?: string;
  verified?: boolean;
  editing?: boolean;
  onEdit?: () => void;
}

export default function ProfileHeader({ name, email, avatarUrl, coverUrl, location, verified = false, editing = false, onEdit }: ProfileHeaderProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="h-36 bg-primary-50">
        {coverUrl && <img src={coverUrl} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="relative px-6 pb-6">
        <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <Avatar src={avatarUrl} name={name} size="xl" verified={verified} className="border-4 border-white" />
            <div className="pb-1">
              <h1 className="flex items-center gap-2 text-2xl font-bold text-neutral-900">
                {name || 'Your profile'}
                {verified && <ShieldCheck className="h-5 w-5 text-primary-600" />}
              </h1>
              {email && <p className="text-sm text-neutral-500">{email}</p>}
              {location && <p className="mt-1 flex items-center gap-1 text-sm text-neutral-600"><MapPin className="h-4 w-4" />{location}</p>}
            </div>
          </div>
          {onEdit && <Button variant={editing ? 'primary' : 'secondary'} size="sm" onClick={onEdit}><Pencil className="mr-2 h-4 w-4" />{editing ? 'Save profile' : 'Edit profile'}</Button>}
        </div>
      </div>
    </section>
  );
}
