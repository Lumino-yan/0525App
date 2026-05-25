import { Routes, Route } from 'react-router';
import { AppProvider } from './hooks/useApp';
import CapturePage from './pages/CapturePage';
import ReviewPage from './pages/ReviewPage';
import ProjectPage from './pages/ProjectPage';
import SettingsPage from './pages/SettingsPage';
import ThoughtPage from './pages/ThoughtPage';

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-[#FFF8E1] max-w-lg mx-auto relative shadow-2xl shadow-[#8D6E63]/10">
        <Routes>
          <Route path="/" element={<CapturePage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/project/:id" element={<ProjectPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/thought/:id" element={<ThoughtPage />} />
        </Routes>
      </div>
    </AppProvider>
  );
}
