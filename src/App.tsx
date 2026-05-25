import { Routes, Route, useLocation, useNavigate } from 'react-router';
import { AppProvider, useApp } from './hooks/useApp';
import Today from './pages/Today';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import NewProject from './pages/NewProject';
import AddLog from './pages/AddLog';
import SettingsPage from './pages/SettingsPage';
import { CalendarDays, FolderOpen, PlusCircle, Settings } from 'lucide-react';

const tabs = [
  { key: 'today', label: '今天', icon: CalendarDays, path: '/' },
  { key: 'projects', label: '项目', icon: FolderOpen, path: '/projects' },
  { key: 'new', label: '新建', icon: PlusCircle, path: '/new-project' },
  { key: 'settings', label: '设置', icon: Settings, path: '/settings' },
];

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { smartTasks } = useApp();

  // Don't show nav on full-screen forms
  const hideNav = location.pathname.startsWith('/add-log') || location.pathname.startsWith('/edit-project');
  const currentTab = tabs.find((t) => t.path === location.pathname)?.key ?? 'today';

  return (
    <div className="min-h-screen bg-neutral-50 max-w-lg mx-auto relative shadow-2xl shadow-neutral-200/50">
      <Routes>
        <Route path="/" element={<Today />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/project/:id" element={<ProjectDetail />} />
        <Route path="/new-project" element={<NewProject />} />
        <Route path="/edit-project/:id" element={<NewProject />} />
        <Route path="/add-log/:id" element={<AddLog />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>

      {/* Bottom Navigation */}
      {!hideNav && (
        <nav className="sticky bottom-0 z-40 bg-white/80 backdrop-blur-xl border-t border-neutral-100">
          <div className="flex items-center justify-around h-16 px-2">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.key;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.key}
                  onClick={() => navigate(tab.path)}
                  className="flex flex-col items-center justify-center gap-0.5 w-16 h-14 relative"
                >
                  <div className="relative">
                    <Icon
                      size={22}
                      className={`transition-colors duration-200 ${
                        isActive ? 'text-violet-600' : 'text-neutral-400'
                      }`}
                      strokeWidth={isActive ? 2.5 : 1.5}
                    />
                    {/* Badge for today tab */}
                    {tab.key === 'today' && smartTasks.filter((t) => t.urgency === 'now').length > 0 && (
                      <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {smartTasks.filter((t) => t.urgency === 'now').length}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-medium transition-colors duration-200 ${
                      isActive ? 'text-violet-600' : 'text-neutral-400'
                    }`}
                  >
                    {tab.label}
                  </span>
                  {isActive && (
                    <div className="absolute -bottom-0 w-8 h-0.5 bg-violet-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Layout />
    </AppProvider>
  );
}
