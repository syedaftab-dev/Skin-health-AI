import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import { useAuth } from './context/AuthContext';

// Public Pages
const Landing = lazy(() => import('./pages/public/Landing'));
const Login = lazy(() => import('./pages/public/Login'));
const RegisterPatient = lazy(() => import('./pages/public/RegisterPatient'));
const RegisterDoctor = lazy(() => import('./pages/public/RegisterDoctor'));

// Patient Pages
const PatientDashboard = lazy(() => import('./pages/patient/Dashboard'));
const PatientUpload = lazy(() => import('./pages/patient/Upload'));
const PatientHistory = lazy(() => import('./pages/patient/History'));
const PatientDoctors = lazy(() => import('./pages/patient/Doctors'));
const DoctorProfile = lazy(() => import('./pages/patient/DoctorProfile'));
const BookAppointment = lazy(() => import('./pages/patient/BookAppointment'));
const PatientAppointments = lazy(() => import('./pages/patient/Appointments'));
const PatientProfileProfile = lazy(() => import('./pages/patient/Profile'));
const TestProfile = lazy(() => import('./pages/patient/TestProfile'));

// Doctor Pages
const DoctorDashboard = lazy(() => import('./pages/doctor/Dashboard'));
const DoctorAppointments = lazy(() => import('./pages/doctor/Appointments'));
const DoctorSchedule = lazy(() => import('./pages/doctor/Schedule'));
const DoctorPatients = lazy(() => import('./pages/doctor/Patients'));
const ClinicSettings = lazy(() => import('./pages/doctor/ClinicSettings'));
const DoctorProfileProfile = lazy(() => import('./pages/doctor/Profile'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const ManageDoctors = lazy(() => import('./pages/admin/ManageDoctors'));
const ManagePatients = lazy(() => import('./pages/admin/ManagePatients'));

const Layout = ({ children }) => (
  <div className="flex min-h-screen bg-background">
    <Sidebar />
    <div className="flex-1 flex flex-col">
      <Header />
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  </div>
);

const App = () => {
  const { user } = useAuth();

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen font-mono font-bold">
        LOADING_SKINAI...
      </div>
    }>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register/patient" element={<RegisterPatient />} />
        <Route path="/register/doctor" element={<RegisterDoctor />} />

        {/* Patient Routes */}
        <Route path="/patient/*" element={
          <ProtectedRoute allowedRoles={['patient']}>
            <Layout>
              <Routes>
                <Route path="dashboard" element={<PatientDashboard />} />
                <Route path="upload" element={<PatientUpload />} />
                <Route path="history" element={<PatientHistory />} />
                <Route path="doctors" element={<PatientDoctors />} />
                <Route path="doctor/:id" element={<DoctorProfile />} />
                <Route path="book/:id" element={<BookAppointment />} />
                <Route path="appointments" element={<PatientAppointments />} />
                <Route path="profile" element={<PatientProfileProfile />} />
                <Route path="test-profile" element={<TestProfile />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />

        {/* Doctor Routes */}
        <Route path="/doctor/*" element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <Layout>
              <Routes>
                <Route path="dashboard" element={<DoctorDashboard />} />
                <Route path="appointments" element={<DoctorAppointments />} />
                <Route path="schedule" element={<DoctorSchedule />} />
                <Route path="patients" element={<DoctorPatients />} />
                <Route path="clinic" element={<ClinicSettings />} />
                <Route path="profile" element={<DoctorProfileProfile />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin/*" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="doctors" element={<ManageDoctors />} />
                <Route path="patients" element={<ManagePatients />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />

        {/* Catch-all redirect */}
        <Route path="*" element={
          user ? (
            <Navigate to={
              user.role === 'admin' ? '/admin/dashboard' : 
              (user.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard')
            } replace />
          ) : (
            <Navigate to="/" replace />
          )
        } />
      </Routes>
    </Suspense>
  );
};

export default App;
