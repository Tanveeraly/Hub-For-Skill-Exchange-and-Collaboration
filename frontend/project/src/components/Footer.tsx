import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-sm text-neutral-600 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
        <p>&copy; {new Date().getFullYear()} HSEC. All rights reserved.</p>
        <div className="flex flex-wrap gap-4">
          <Link to="/marketplace" className="hover:text-primary-600">Marketplace</Link>
          <Link to="/login" className="hover:text-primary-600">Login</Link>
          <Link to="/signup" className="hover:text-primary-600">Sign up</Link>
          <Link to="/support" className="hover:text-primary-600">Support</Link>
        </div>
      </div>
    </footer>
  );
}
