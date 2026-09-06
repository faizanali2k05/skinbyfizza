import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { Spinner } from './components';
import { PatientLayout, PlainLayout, StaffLayout } from './layouts/Layouts';

// Auth
import Welcome from './pages/Welcome';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';

// Patient
import Discover from './pages/Discover';
import Treatments from './pages/Treatments';
import AiConsultant from './pages/AiConsultant';
import Profile from './pages/Profile';
import More from './pages/More';
import ProfileEdit from './pages/ProfileEdit';
import MyAppointments from './pages/MyAppointments';
import Prescriptions from './pages/Prescriptions';
import Notifications from './pages/Notifications';
import About from './pages/About';
import BookAppointment from './pages/BookAppointment';
import PatientChat from './pages/PatientChat';

// Staff
import StaffDashboard from './pages/staff/Dashboard';
import StaffChats from './pages/staff/Chats';
import StaffChatThread from './pages/staff/ChatThread';
import StaffUsers from './pages/staff/Users';
import StaffUserDetail from './pages/staff/UserDetail';
import StaffAppointments from './pages/staff/Appointments';
import StaffAssignAppointment from './pages/staff/AssignAppointment';
import StaffTreatments from './pages/staff/Treatments';
import StaffTreatmentForm from './pages/staff/TreatmentForm';
import StaffPrescriptionForm from './pages/staff/PrescriptionForm';

function FullScreenLoader() {
  return (
    <div className="app-shell" style={{ display: 'grid', placeItems: 'center', minHeight: '100dvh' }}>
      <Spinner />
    </div>
  );
}

/** Signed-in users only. Staff area additionally requires a staff role. */
function RequireAuth({ staff, children }: { staff?: boolean; children: React.ReactNode }) {
  const { initializing, isAuthenticated, isStaff } = useAuth();
  const location = useLocation();

  if (initializing) return <FullScreenLoader />;
  if (!isAuthenticated) return <Navigate to="/welcome" replace state={{ from: location.pathname }} />;
  if (staff && !isStaff) return <Navigate to="/app/discover" replace />;
  // Staff belong in their console, not the patient shell — mirrors AuthGate.
  if (!staff && isStaff) return <Navigate to="/staff" replace />;
  return <>{children}</>;
}

/** Entry route: land by auth state + role once the session restores. */
function RootRedirect() {
  const { initializing, isAuthenticated, isStaff } = useAuth();
  if (initializing) return <FullScreenLoader />;
  if (!isAuthenticated) return <Navigate to="/welcome" replace />;
  return <Navigate to={isStaff ? '/staff' : '/app/discover'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      {/* Public / auth */}
      <Route element={<PlainLayout />}>
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/about" element={<About />} />
      </Route>

      {/* Patient shell */}
      <Route
        element={
          <RequireAuth>
            <PatientLayout />
          </RequireAuth>
        }
      >
        <Route path="/app/discover" element={<Discover />} />
        <Route path="/app/treatments" element={<Treatments />} />
        <Route path="/app/ai" element={<AiConsultant />} />
        <Route path="/app/profile" element={<Profile />} />
        <Route path="/app/more" element={<More />} />
        <Route path="/app/profile/edit" element={<ProfileEdit />} />
        <Route path="/app/appointments" element={<MyAppointments />} />
        <Route path="/app/prescriptions" element={<Prescriptions />} />
        <Route path="/app/notifications" element={<Notifications />} />
        <Route path="/app/chat" element={<PatientChat />} />
        <Route path="/app/book/:procedureId" element={<BookAppointment />} />
        <Route path="/app/about" element={<About />} />
      </Route>

      {/* Staff console */}
      <Route
        element={
          <RequireAuth staff>
            <StaffLayout />
          </RequireAuth>
        }
      >
        <Route path="/staff" element={<StaffDashboard />} />
        <Route path="/staff/chats" element={<StaffChats />} />
        <Route path="/staff/chats/:id" element={<StaffChatThread />} />
        <Route path="/staff/users" element={<StaffUsers />} />
        <Route path="/staff/users/:id" element={<StaffUserDetail />} />
        <Route path="/staff/appointments" element={<StaffAppointments />} />
        <Route path="/staff/appointments/new" element={<StaffAssignAppointment />} />
        <Route path="/staff/treatments" element={<StaffTreatments />} />
        <Route path="/staff/treatments/new" element={<StaffTreatmentForm />} />
        <Route path="/staff/treatments/:id" element={<StaffTreatmentForm />} />
        <Route path="/staff/prescriptions/new" element={<StaffPrescriptionForm />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
