import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { AuthProvider } from './context/AuthContext'
import { DeckProvider } from './context/DeckContext'
import { GroupStudyProvider } from './context/GroupStudyContext'
import { LanguageProvider } from './context/LanguageContext'
import { StudyProvider } from './context/StudyContext'
import { Advisory } from './screens/Advisory'
import { AppHome } from './screens/AppHome'
import { Dashboard } from './screens/Dashboard'
import { Guidance } from './screens/Guidance'
import { LandingPage } from './screens/LandingPage'
import { MyStudy } from './screens/MyStudy'
import { Onboarding } from './screens/Onboarding'
import { Practice } from './screens/Practice'
import { Profile } from './screens/Profile'
import { SignIn } from './screens/SignIn'
import { SignUp } from './screens/SignUp'
import { Tutor } from './screens/Tutor'
import { SessionActivePage } from './studyg/SessionActivePage'
import { SessionCreatePage } from './studyg/SessionCreatePage'
import { SessionsPage } from './studyg/SessionsPage'
import { StudyGHub } from './studyg/StudyGHub'

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <StudyProvider>
          <DeckProvider>
            <GroupStudyProvider>
              <BrowserRouter>
            <Routes>
              {/* ── Public ── */}
              <Route index element={<LandingPage />} />
              <Route path="signin" element={<SignIn />} />
              <Route path="signup" element={<SignUp />} />

              {/* ── Authenticated app shell ── */}
              <Route path="app" element={<AppLayout />}>
                <Route index element={<AppHome />} />
                <Route path="tutor" element={<Tutor />} />
                <Route path="practice" element={<Practice />} />
                <Route path="guidance" element={<Guidance />} />
                <Route path="advisory" element={<Advisory />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="mystudy" element={<MyStudy />} />
                <Route path="profile" element={<Profile />} />
                <Route path="onboarding" element={<Onboarding />} />
                <Route path="studyg" element={<StudyGHub />} />
                <Route path="studyg/sessions" element={<SessionsPage />} />
                <Route path="studyg/sessions/new" element={<SessionCreatePage />} />
                <Route path="studyg/sessions/:id" element={<SessionActivePage />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
              </BrowserRouter>
            </GroupStudyProvider>
          </DeckProvider>
        </StudyProvider>
      </LanguageProvider>
    </AuthProvider>
  )
}
