import { Globe, Mail, MapPin } from 'lucide-react';
import Card from '../ui/Card';

interface ProfileAboutProps {
  bio?: string;
  email?: string;
  location?: string;
  website?: string;
}

export default function ProfileAbout({ bio, email, location, website }: ProfileAboutProps) {
  return <Card className="p-6"><h2 className="text-lg font-semibold">About</h2><p className="mt-3 text-sm leading-6 text-neutral-600">{bio || 'Add a professional summary to help the community understand your experience.'}</p><div className="mt-5 space-y-3 border-t border-neutral-100 pt-5 text-sm text-neutral-600">{email && <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary-600" />{email}</p>}{location && <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary-600" />{location}</p>}{website && <a className="flex items-center gap-2 text-primary-600 hover:underline" href={website} target="_blank" rel="noreferrer"><Globe className="h-4 w-4" />{website}</a>}</div></Card>;
}
