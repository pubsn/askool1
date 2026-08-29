import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AuthCallback from "@/components/AuthCallback";

import Landing from "@/pages/Landing";
import HowItWorks from "@/pages/HowItWorks";
import Pricing from "@/pages/Pricing";
import ForSchools from "@/pages/ForSchools";
import About from "@/pages/About";
import FAQPage from "@/pages/FAQ";
import Contact from "@/pages/Contact";
import LegalPage from "@/pages/LegalPage";
import FindEducators from "@/pages/FindEducators";
import EducatorProfile from "@/pages/EducatorProfile";
import FindJobs from "@/pages/FindJobs";
import JobDetail from "@/pages/JobDetail";

import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import VerifyEmail from "@/pages/auth/VerifyEmail";

import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHome from "@/pages/dashboard/DashboardHome";
import EducatorProfileEdit from "@/pages/dashboard/EducatorProfileEdit";
import Applications from "@/pages/dashboard/Applications";
import Bookings from "@/pages/dashboard/Bookings";
import Favorites from "@/pages/dashboard/Favorites";
import Reviews from "@/pages/dashboard/Reviews";
import Subscription from "@/pages/dashboard/Subscription";
import Payments from "@/pages/dashboard/Payments";
import PublishJob from "@/pages/dashboard/PublishJob";
import MyJobs from "@/pages/dashboard/MyJobs";
import CVtheque from "@/pages/dashboard/CVtheque";
import SchoolProfile from "@/pages/dashboard/SchoolProfile";
import Students from "@/pages/dashboard/Students";
import ZoneAlerts from "@/pages/dashboard/ZoneAlerts";
import TutoringRequests from "@/pages/dashboard/TutoringRequests";
import Messages from "@/pages/dashboard/Messages";
import Notifications from "@/pages/dashboard/Notifications";
import Settings from "@/pages/dashboard/Settings";
import AdminDashboard from "@/pages/dashboard/AdminDashboard";

function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) return <AuthCallback />;
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/comment-ca-marche" element={<HowItWorks />} />
      <Route path="/tarifs" element={<Pricing />} />
      <Route path="/pour-les-ecoles" element={<ForSchools />} />
      <Route path="/a-propos" element={<About />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/cgu" element={<LegalPage kind="cgu" />} />
      <Route path="/confidentialite" element={<LegalPage kind="confidentialite" />} />
      <Route path="/cookies" element={<LegalPage kind="cookies" />} />
      <Route path="/educateurs" element={<FindEducators />} />
      <Route path="/educateurs/:userId" element={<EducatorProfile />} />
      <Route path="/emplois" element={<FindJobs />} />
      <Route path="/emplois/:offerId" element={<JobDetail />} />

      <Route path="/connexion" element={<Login />} />
      <Route path="/inscription" element={<Register />} />
      <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<DashboardHome />} />
        <Route path="profil" element={<EducatorProfileEdit />} />
        <Route path="candidatures" element={<Applications />} />
        <Route path="reservations" element={<Bookings />} />
        <Route path="favoris" element={<Favorites />} />
        <Route path="avis" element={<Reviews />} />
        <Route path="abonnement" element={<Subscription />} />
        <Route path="paiements" element={<Payments />} />
        <Route path="educateurs" element={<FindEducators embedded />} />
        <Route path="emplois" element={<FindJobs embedded />} />
        <Route path="etablissement" element={<SchoolProfile />} />
        <Route path="publier" element={<PublishJob />} />
        <Route path="offres" element={<MyJobs />} />
        <Route path="cvtheque" element={<CVtheque />} />
        <Route path="eleves" element={<Students />} />
        <Route path="alertes" element={<ZoneAlerts />} />
        <Route path="demandes" element={<TutoringRequests />} />
        <Route path="messages" element={<Messages />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="parametres" element={<Settings />} />
        <Route path="admin" element={<AdminDashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
