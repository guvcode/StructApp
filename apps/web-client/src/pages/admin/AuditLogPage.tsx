import { useNavigate } from 'react-router-dom';
import { AuditLogViewer } from '../../components/AuditLogViewer';

export default function AuditLogPage() {
  const navigate = useNavigate();
  return (
    <div className="animate-fadeIn">
      <div className="p-8 pb-0 max-w-7xl mx-auto">
        <button onClick={() => navigate('/admin/dashboard')} className="text-sm text-accent mb-4">&larr; Admin Dashboard</button>
      </div>
      <AuditLogViewer />
    </div>
  );
}