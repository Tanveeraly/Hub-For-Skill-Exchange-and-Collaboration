import { Star } from 'lucide-react';
import Card from '../ui/Card';
interface Review { id: string | number; reviewerName: string; rating: number; text: string; }
export default function ProfileReviews({ reviews }: { reviews: Review[] }) {
  return <div className="space-y-3">{reviews.length ? reviews.map((review) => <Card key={review.id} className="p-5"><div className="flex items-center justify-between"><h3 className="font-semibold">{review.reviewerName}</h3><span className="flex items-center gap-1 text-sm text-amber-500"><Star className="h-4 w-4 fill-current" />{review.rating}</span></div><p className="mt-2 text-sm text-neutral-600">{review.text}</p></Card>) : <Card className="p-6 text-sm text-neutral-500">No reviews yet.</Card>}</div>;
}
