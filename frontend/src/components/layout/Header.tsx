import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/property/bungalow-a', label: 'Properties' },
  { to: '#contact', label: 'Contact' },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 lg:px-8">
        <Link
          to="/"
          className="text-lg font-semibold text-gray-900"
          aria-label="Thane Bungalows home"
        >
          Thane Bungalows
        </Link>

        <nav className="hidden md:flex md:items-center md:gap-6" aria-label="Main">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              {label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="md:hidden rounded p-2 text-gray-600 hover:bg-gray-100"
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div
          className="absolute left-0 right-0 top-14 border-b border-gray-200 bg-white px-4 py-4 shadow md:hidden"
          role="dialog"
          aria-label="Mobile menu"
        >
          <nav className="flex flex-col gap-2" aria-label="Main mobile">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
