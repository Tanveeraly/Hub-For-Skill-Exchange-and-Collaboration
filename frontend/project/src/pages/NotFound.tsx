import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

export default function NotFound() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold text-primary-700">Page not found</p>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">We couldn't find that page</h1>
        <p className="mt-2 text-neutral-600">The link may be old, or the page may have moved.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to={isAuthenticated ? '/home' : '/'} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
            Go to {isAuthenticated ? 'Home' : 'the start page'}
          </Link>
          <Link to="/marketplace" className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50">
            Browse skills
          </Link>
        </div>
      </div>
    </div>
  );
}
