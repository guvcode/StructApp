import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <h1 className="text-5xl font-bold text-text-primary mb-2">404</h1>
      <p className="text-lg text-text-secondary mb-2">Page Not Found</p>
      <p className="text-sm text-text-secondary mb-6 text-center max-w-md">
        The page you are looking for does not exist or may have been moved.
      </p>
      <div className="flex gap-3">
        <Link to="/" className="px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90">Go to Home</Link>
        <Link to="/login" className="px-4 py-2 border border-border text-text-primary rounded-lg hover:bg-gray-50">Return to Login</Link>
      </div>
    </div>
  );
}