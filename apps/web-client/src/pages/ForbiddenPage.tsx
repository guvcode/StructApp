import { Link } from 'react-router-dom';

export default function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <h1 className="text-5xl font-bold text-text-primary mb-2">403</h1>
      <p className="text-lg text-text-secondary mb-2">Forbidden</p>
      <p className="text-sm text-text-secondary mb-6 text-center max-w-md">
        You do not have the required permissions to access this page.
        Some actions are restricted to specific roles — if you believe this is an error, contact your administrator.
      </p>
      <div className="flex gap-3">
        <Link to="/" className="px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90">Go to Home</Link>
        <Link to="/login" className="px-4 py-2 border border-border text-text-primary rounded-lg hover:bg-gray-50">Return to Login</Link>
      </div>
    </div>
  );
}