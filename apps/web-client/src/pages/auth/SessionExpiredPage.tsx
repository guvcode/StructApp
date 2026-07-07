import { Link } from 'react-router-dom';
import Card from '../../components/Card';

export default function SessionExpiredPage() {
  return (
    <Card className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Session expired</h1>
        <p className="text-text-secondary">
          Your session has expired. Please sign in again to continue.
        </p>
      </div>
      
      <Link
        to="/login"
        className="block w-full py-3 px-4 bg-accent text-white font-semibold rounded-lg text-center hover:opacity-90 transition-opacity shadow-sm"
      >
        Sign in again
      </Link>
    </Card>
  );
}