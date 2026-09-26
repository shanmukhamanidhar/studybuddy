import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OnboardingPage from "./pages/OnboardingPage";
import HomePage from "./pages/HomePage";
import CoursesPage from "./pages/CoursesPage";
import AssignmentsPage from "./pages/AssignmentsPage";
import SubjectWorkspacePage from "./pages/SubjectWorkspacePage";
import PracticePage from "./pages/PracticePage";
import LabsPage from "./pages/LabsPage";
import ExamsPage from "./pages/ExamsPage";
import HistoryPage from "./pages/HistoryPage";
import AcademicsPage from "./pages/AcademicsPage";
import ArenasPage from "./pages/ArenasPage";
import BattlePage from "./pages/BattlePage";
import DashboardPage from "./pages/DashboardPage";
import AchievementsPage from "./pages/AchievementsPage";
import WeakAreasPage from "./pages/WeakAreasPage";
import SettingsPage from "./pages/SettingsPage";

// Authenticated Platform Route Guard (Requires Onboarding)
function PlatformRoute({ children }) {
  const { currentUser, userProfile, loading, profileLoaded } = useAuth();
  if (loading || !profileLoaded) return null;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!userProfile?.onboardingCompleted) return <Navigate to="/onboarding" replace />;
  return children;
}

// Onboarding Route Guard
function OnboardingRoute({ children }) {
  const { currentUser, userProfile, loading, profileLoaded } = useAuth();
  if (loading || !profileLoaded) return null;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (userProfile?.onboardingCompleted) return <Navigate to="/app" replace />;
  return children;
}

// Public Auth Route Guard
function PublicAuthRoute({ children }) {
  const { currentUser, userProfile, loading, profileLoaded } = useAuth();
  if (loading || !profileLoaded) return null;
  if (currentUser) {
    if (userProfile?.onboardingCompleted) {
      return <Navigate to="/app" replace />;
    }
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
          
          <Route
            path="/login"
            element={
              <PublicAuthRoute>
                <LoginPage />
              </PublicAuthRoute>
            }
          />
          
          <Route
            path="/register"
            element={
              <PublicAuthRoute>
                <RegisterPage />
              </PublicAuthRoute>
            }
          />
          
          <Route
            path="/onboarding"
            element={
              <OnboardingRoute>
                <OnboardingPage />
              </OnboardingRoute>
            }
          />

          {/* Focused Semester Command Center Routes */}
          <Route
            path="/app"
            element={
              <PlatformRoute>
                <HomePage />
              </PlatformRoute>
            }
          />

          <Route
            path="/courses"
            element={
              <PlatformRoute>
                <CoursesPage />
              </PlatformRoute>
            }
          />

          <Route
            path="/assignments"
            element={
              <PlatformRoute>
                <AssignmentsPage />
              </PlatformRoute>
            }
          />

          <Route
            path="/subjects"
            element={<Navigate to="/courses" replace />}
          />

          <Route
            path="/subjects/:subjectId"
            element={
              <PlatformRoute>
                <SubjectWorkspacePage />
              </PlatformRoute>
            }
          />

          <Route
            path="/practice"
            element={
              <PlatformRoute>
                <PracticePage />
              </PlatformRoute>
            }
          />

          <Route
            path="/labs"
            element={<Navigate to="/practice" replace />}
          />

          <Route
            path="/exams"
            element={
              <PlatformRoute>
                <ExamsPage />
              </PlatformRoute>
            }
          />

          <Route
            path="/history"
            element={
              <PlatformRoute>
                <HistoryPage />
              </PlatformRoute>
            }
          />

          <Route
            path="/academics"
            element={
              <PlatformRoute>
                <AcademicsPage />
              </PlatformRoute>
            }
          />

          <Route
            path="/arenas"
            element={
              <PlatformRoute>
                <ArenasPage />
              </PlatformRoute>
            }
          />

          <Route
            path="/battle/:code"
            element={
              <PlatformRoute>
                <BattlePage />
              </PlatformRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <PlatformRoute>
                <DashboardPage />
              </PlatformRoute>
            }
          />

          <Route
            path="/achievements"
            element={
              <PlatformRoute>
                <AchievementsPage />
              </PlatformRoute>
            }
          />

          <Route
            path="/weak-areas"
            element={
              <PlatformRoute>
                <WeakAreasPage />
              </PlatformRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <PlatformRoute>
                <SettingsPage />
              </PlatformRoute>
            }
          />

          {/* Fallback Wildcard */}
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}
