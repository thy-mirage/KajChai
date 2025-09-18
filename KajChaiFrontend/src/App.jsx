import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Login from './components/Login';
import Signup from './components/Signup';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Dashboard from './components/Dashboard';
import DashboardRouter from './components/DashboardRouter';
import MyProfile from './components/MyProfile';
import Chat from './components/Chat';
import CreateHirePost from './components/CreateHirePost';
import HirePostList from './components/HirePostList';
import WorkerList from './components/WorkerList';
import JobsPage from './components/JobsPage';
import HirePostApplications from './components/HirePostApplications';
import Notifications from './components/Notifications';
import Forum from './components/Forum';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import AdminComplaintManagement from './components/AdminComplaintManagement';
import AdminUserComplaintManagement from './components/AdminUserComplaintManagement';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Review from './components/Review';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute adminOnly={true} showBackButton={false}>
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/complaints" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminLayout>
                    <AdminComplaintManagement embedded={true} />
                  </AdminLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/user-complaints" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminLayout>
                    <AdminUserComplaintManagement embedded={true} />
                  </AdminLayout>
                </ProtectedRoute>
              } 
            />

            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute showBackButton={false}>
                  <DashboardRouter />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/my-profile" 
              element={
                <ProtectedRoute>
                  <MyProfile />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/chat" 
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/forum" 
              element={
                <ProtectedRoute>
                  <Forum />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/reviews" 
              element={
                <ProtectedRoute>
                  <Review />
                </ProtectedRoute>
              } 
            />

            {/* HirePost Routes */}
            <Route 
              path="/create-post" 
              element={
                <ProtectedRoute>
                  <CreateHirePost />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/jobs" 
              element={
                <ProtectedRoute>
                  <JobsPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/my-posts/:postId/applications" 
              element={
                <ProtectedRoute>
                  <HirePostApplications />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/notifications" 
              element={
                <ProtectedRoute title="Notifications">
                  <Notifications />
                </ProtectedRoute>
              } 
            />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Catch all route - also redirect to dashboard which will handle admin routing */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
