import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Therapists from "./pages/Therapists";
import TherapistProfile from "./pages/TherapistProfile";
import UserDashboard from "./pages/UserDashboard";
import TherapistDashboard from "./pages/TherapistDashboard";
import Sessions from "./pages/Sessions";
import TherapistSessionNotes from "./pages/TherapistSessionNotes";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Appointments from "./pages/Appointments";
import Patients from "./pages/Patients";
import Availability from "./pages/Availability";
import Booking from "./pages/Booking";
import PatientProfile from "./pages/PatientProfile";
import IntakeForm from "./pages/IntakeForm";
import Packages from "./pages/Packages";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTherapists from "./pages/AdminTherapists";
import AdminUsers from "./pages/AdminUsers";
import Chat from "./pages/Chat";
import Analytics from "./pages/Analytics";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/therapists"
          element={<Therapists />}
        />
        <Route
          path="/therapists/:slug"
          element={<TherapistProfile />}
        />
        <Route
          path="/user-dashboard"
          element={<UserDashboard />}
        />
        <Route
          path="/therapist-dashboard"
          element={<TherapistDashboard />}
        />
        <Route
          path="/sessions"
          element={<Sessions />}
        />
        <Route
          path="/profile"
          element={<Profile />}
        />
        <Route
          path="/appointments"
          element={<Appointments />}
        />
        <Route
          path="/patients"
          element={<Patients />}
        />
        <Route
          path="/patients/:patientId"
          element={<PatientProfile />}
        />
        <Route
          path="/availability"
          element={<Availability />}
        />
        <Route
          path="/book-session/:slug"
          element={<Booking />}
        />
        <Route
          path="/session-notes"
          element={<TherapistSessionNotes />}
        />
        <Route
          path="/user-profile"
          element={<UserProfile />}
        />
        <Route
          path="/intake-form"
          element={<IntakeForm />}
        />
        <Route
          path="/packages"
          element={<Packages />}
        />
        <Route
          path="/chat/:otherUserRole/:otherUserId"
          element={<Chat />}
        />
        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />
        <Route
          path="/admin/dashboard"
          element={<AdminDashboard />}
        />
        <Route
          path="/admin/users"
          element={<AdminUsers />}
        />
        <Route
          path="/admin/therapists"
          element={<AdminTherapists />}
        />
        <Route
          path="/therapist/analytics"
          element={<Analytics />}
        />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
