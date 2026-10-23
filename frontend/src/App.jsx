import React, { Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

// Robust Error Boundary
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[React ErrorBoundary caught error]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F5F3FF] flex flex-col items-center justify-center p-6 text-center text-[#302B43]">
          <div className="bg-white border border-[#E7E2F0] rounded-3xl p-8 max-w-lg shadow-xl space-y-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto border border-rose-200 text-xl font-bold">
              !
            </div>
            <h2 className="text-base font-extrabold text-[#302B43]">View encountered an issue</h2>
            <p className="text-xs text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200 text-left font-mono whitespace-pre-wrap">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <div className="flex justify-center space-x-3 pt-2">
              <button
                onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
                className="px-5 py-2 bg-[#8B78C6] hover:bg-[#7865B3] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
              >
                Reload Page
              </button>
              <button
                onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
                className="px-4 py-2 bg-[#E9E2FF] hover:bg-[#D9CFFF] text-[#4D3E7B] text-xs font-bold rounded-xl transition border border-[#D9CFFF] cursor-pointer"
              >
                Reset Session & Login
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { MyProjectsPage } from './pages/MyProjectsPage';
import { CreateProjectPage } from './pages/CreateProjectPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { UploadZipPage } from './pages/UploadZipPage';
import { AnalysisResultsPage } from './pages/AnalysisResultsPage';
import { IssueDetailsPage } from './pages/IssueDetailsPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { TaskManagementPage } from './pages/TaskManagementPage';
import { ProjectHistoryPage } from './pages/ProjectHistoryPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

// Protected Route Wrapper
const ProtectedLayout = ({ children }) => {
  const { user, loading } = useAuth();
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');

  if (loading && !user && !storedUser) {
    return (
      <div className="min-h-screen bg-[#F5F3FF] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#8B78C6] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-[#6A6282] font-mono">Authenticating session...</span>
        </div>
      </div>
    );
  }

  if (!user && !token && !storedUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F5F3FF] text-[#302B43] flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-[#F5F3FF]">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Core */}
            <Route
              path="/dashboard"
              element={
                <ProtectedLayout>
                  <DashboardPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedLayout>
                  <UploadZipPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/analyses/:analysisId"
              element={
                <ProtectedLayout>
                  <AnalysisResultsPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/issues/:issueId"
              element={
                <ProtectedLayout>
                  <IssueDetailsPage />
                </ProtectedLayout>
              }
            />

            {/* Projects */}
            <Route
              path="/projects"
              element={
                <ProtectedLayout>
                  <MyProjectsPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/projects/new"
              element={
                <ProtectedLayout>
                  <CreateProjectPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/projects/:id"
              element={
                <ProtectedLayout>
                  <ProjectDetailPage />
                </ProtectedLayout>
              }
            />

            {/* Utilities */}
            <Route
              path="/assistant"
              element={
                <ProtectedLayout>
                  <AIAssistantPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedLayout>
                  <TaskManagementPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedLayout>
                  <ProjectHistoryPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedLayout>
                  <ReportsPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedLayout>
                  <SettingsPage />
                </ProtectedLayout>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
