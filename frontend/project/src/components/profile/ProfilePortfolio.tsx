import Card from '../ui/Card';
interface PortfolioItem { id: string | number; title: string; description: string; url?: string; mediaType?: string; }
export default function ProfilePortfolio({ items }: { items: PortfolioItem[] }) {
  return <div className="grid gap-4 md:grid-cols-2">{items.map((item) => <Card key={item.id} hover className="overflow-hidden">{item.url && item.mediaType === 'image' && <img src={item.url} alt={item.title} className="h-40 w-full object-cover" />}<div className="p-5"><h3 className="font-semibold text-neutral-900">{item.title}</h3><p className="mt-2 line-clamp-3 text-sm text-neutral-600">{item.description}</p>{item.url && <a href={item.url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-medium text-primary-600 hover:underline">View project</a>}</div></Card>)}</div>;
}
