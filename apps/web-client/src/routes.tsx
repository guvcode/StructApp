import { Routes, Route } from 'react-router-dom';
import RouteGuard from './components/RouteGuard';
import FeatureFlagGuard from './components/FeatureFlagGuard';
import AuthLayout from './layouts/AuthLayout';
import MobileShell from './layouts/MobileShell';
import DesktopShell from './layouts/DesktopShell';
import LoginPage from './pages/auth/LoginPage';
import ActivatePage from './pages/auth/ActivatePage';
import ClientPickerPage from './pages/auth/ClientPickerPage';
import SessionExpiredPage from './pages/auth/SessionExpiredPage';
import DashboardPage from './pages/mobile/DashboardPage';
import SyncPage from './pages/mobile/SyncPage';
import InspectionDetailPage from './pages/mobile/InspectionDetailPage';
import InspectionSubmitPage from './pages/mobile/InspectionSubmitPage';
import InspectionHistoryPage from './pages/mobile/InspectionHistoryPage';
import StructureSearchPage from './pages/mobile/StructureSearchPage';
import MobileDeficiencyDetailPage from './pages/mobile/DeficiencyDetailPage';
import DeficiencyPhotosPage from './pages/mobile/DeficiencyPhotosPage';
import RemediationUpdatePage from './pages/mobile/RemediationUpdatePage';
import TimesheetListPage from './pages/mobile/TimesheetListPage';
import TimesheetDetailPage from './pages/mobile/TimesheetDetailPage';
import SettingsPage from './pages/mobile/SettingsPage';
import PendingStructuresListPage from './pages/mobile/PendingStructuresListPage';
import PendingStructureCapturePage from './pages/mobile/PendingStructureCapturePage';
import ReconciliationQueuePage from './pages/reviewer/ReconciliationQueuePage';
import ReviewerDashboardPage from './pages/reviewer/ReviewerDashboardPage';
import InspectionListPage from './pages/reviewer/InspectionListPage';
import ReviewerInspectionDetail from './pages/reviewer/InspectionDetailPage';
import InspectionReviewPage from './pages/reviewer/InspectionReviewPage';
import ReviewerDeficiencyDetailPage from './pages/reviewer/DeficiencyDetailPage';
import RemediationQueuePage from './pages/reviewer/RemediationQueuePage';
import TimesheetReviewPage from './pages/reviewer/TimesheetReviewPage';
import TimesheetReviewDetailPage from './pages/reviewer/TimesheetReviewDetailPage';
import RegisterLandingPage from './pages/reviewer/RegisterLandingPage';
import ProjectListPage from './pages/reviewer/ProjectListPage';
import SiteListPage from './pages/reviewer/SiteListPage';
import StructureListPage from './pages/reviewer/StructureListPage';
import NewInspectionPage from './pages/reviewer/NewInspectionPage';
import ReportCenterPage from './pages/reviewer/ReportCenterPage';
import PicklistLandingPage from './pages/reviewer/PicklistLandingPage';
import PicklistWorkTypesPage from './pages/reviewer/PicklistWorkTypesPage';
import TaxonomyManagerPage from './pages/reviewer/TaxonomyManagerPage';
import CalendarPage from './pages/reviewer/CalendarPage';
import CalendarSchedulesPage from './pages/reviewer/CalendarSchedulesPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import ClientListPage from './pages/admin/ClientListPage';
import NewClientPage from './pages/admin/NewClientPage';
import UserListPage from './pages/admin/UserListPage';
import InviteUserPage from './pages/admin/InviteUserPage';
import ImportCenterPage from './pages/admin/ImportCenterPage';
import ImportHistoryPage from './pages/admin/ImportHistoryPage';
import AuditLogPage from './pages/admin/AuditLogPage';
import PinSetupPage from './pages/auth/PinSetupPage';
import ForbiddenPage from './pages/ForbiddenPage';
import NotFoundPage from './pages/NotFoundPage';
import EmailQueuePage from './pages/admin/EmailQueuePage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/forbidden" element={<ForbiddenPage />} />
      <Route path="/" element={<RouteGuard />}>
        <Route element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="activate" element={<ActivatePage />} />
          <Route path="select-client" element={<ClientPickerPage />} />
          <Route path="session-expired" element={<SessionExpiredPage />} />
          <Route path="m/setup-pin" element={<PinSetupPage />} />
        </Route>
        <Route element={<MobileShell />}>
          <Route path="m/dashboard" element={<DashboardPage />} />
          <Route path="m/sync" element={<SyncPage />} />
          <Route path="m/inspections/:id" element={<InspectionDetailPage />} />
          <Route path="m/inspections/:id/submit" element={<InspectionSubmitPage />} />
          <Route path="m/inspections/:id/history" element={<InspectionHistoryPage />} />
          <Route path="m/structures/search" element={<StructureSearchPage />} />
          <Route path="m/deficiencies/:localId" element={<MobileDeficiencyDetailPage />} />
          <Route path="m/deficiencies/:localId/photos" element={<DeficiencyPhotosPage />} />
          <Route path="m/deficiencies/:id/remediation" element={<RemediationUpdatePage />} />
          <Route path="m/timesheets" element={<TimesheetListPage />} />
          <Route path="m/timesheets/new" element={<TimesheetDetailPage />} />
          <Route path="m/timesheets/:id" element={<TimesheetDetailPage />} />
          <Route path="m/settings" element={<SettingsPage />} />
          <Route path="m/pending-structures" element={<PendingStructuresListPage />} />
          <Route path="m/pending-structures/new" element={<PendingStructureCapturePage />} />
        </Route>
        <Route element={<DesktopShell />}>
          <Route path="reviewer/dashboard" element={<ReviewerDashboardPage />} />
          <Route path="inspections" element={<InspectionListPage />} />
          <Route path="inspections/:id/detail" element={<ReviewerInspectionDetail />} />
          <Route path="inspections/:id/review" element={<InspectionReviewPage />} />
          <Route path="deficiencies/:id" element={<ReviewerDeficiencyDetailPage />} />
          <Route path="remediation" element={<FeatureFlagGuard flagId="remediation" />}>
            <Route index element={<RemediationQueuePage />} />
          </Route>
          <Route path="pending-structures" element={<ReconciliationQueuePage />} />
          <Route path="timesheets/review" element={<FeatureFlagGuard flagId="timesheets" />}>
            <Route index element={<TimesheetReviewPage />} />
            <Route path="detail" element={<TimesheetReviewDetailPage />} />
          </Route>
          <Route path="register" element={<RegisterLandingPage />} />
          <Route path="register/projects" element={<ProjectListPage />} />
          <Route path="register/sites" element={<SiteListPage />} />
          <Route path="register/structures" element={<StructureListPage />} />
          <Route path="register/inspections/new" element={<NewInspectionPage />} />
          <Route path="reports" element={<FeatureFlagGuard flagId="reports" />}>
            <Route index element={<ReportCenterPage />} />
          </Route>
<Route path="categories" element={<FeatureFlagGuard flagId="picklists" />}>
            <Route index element={<PicklistLandingPage />} />
            <Route path="work-types" element={<PicklistWorkTypesPage />} />
            <Route path="taxonomy" element={<TaxonomyManagerPage />} />
          </Route>
          <Route path="calendar" element={<FeatureFlagGuard flagId="calendar" />}>
            <Route index element={<CalendarPage />} />
            <Route path="schedules" element={<CalendarSchedulesPage />} />
          </Route>
          <Route path="admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="admin/clients" element={<ClientListPage />} />
          <Route path="admin/clients/new" element={<NewClientPage />} />
          <Route path="admin/users" element={<UserListPage />} />
          <Route path="admin/users/invite" element={<InviteUserPage />} />
          <Route path="admin/imports" element={<FeatureFlagGuard flagId="imports" />}>
            <Route index element={<ImportCenterPage />} />
            <Route path="history" element={<ImportHistoryPage />} />
          </Route>
          <Route path="admin/audit-logs" element={<FeatureFlagGuard flagId="audit_logs" />}>
            <Route index element={<AuditLogPage />} />
          </Route>
          <Route path="admin/email-queue" element={<EmailQueuePage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}