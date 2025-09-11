import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Login from './components/Login';
import Signup from './components/Signup';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Dashboard from './components/Dashboard';
import MyProfile from './components/MyProfile';
import Chat from './components/chat';
import CreateHirePost from './components/CreateHirePost';
import HirePostList from './components/HirePostList';
import HirePostApplications from './components/HirePostApplications';
import Notifications from './components/Notifications';
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

            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute showBackButton={false}>
                  <Dashboard />
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
                  <HirePostList />
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
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
