import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Thane Bungalows</p>
            <p className="mt-1 text-sm text-gray-500">
              Vacation bungalows in Thane, Maharashtra
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm md:flex-row md:gap-6">
            <Link
              to="/privacy-policy"
              className="text-gray-600 hover:text-gray-900"
            >
              Privacy Policy
            </Link>
            <a
              href="mailto:contact@thanebungalows.com"
              className="text-gray-600 hover:text-gray-900"
            >
              Contact
            </a>
          </div>
        </div>
        <p className="mt-6 border-t border-gray-100 pt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Thane Bungalows. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
