import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { StoreProvider, useStore } from "./lib/store";
import Layout from "./components/Layout";
import RewardToast from "./components/RewardToast";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import HabitsPage from "./pages/Habits";
import PracticePage from "./pages/Practice";
import MindsetPage from "./pages/Mindset";
import BadgesPage from "./pages/Badges";
import SettingsPage from "./pages/Settings";

function AppShell() {
  const { state } = useStore();

  if (!state.profile) {
    return <Onboarding />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="habits" element={<HabitsPage />} />
          <Route path="practice" element={<PracticePage />} />
          <Route path="mindset" element={<MindsetPage />} />
          <Route path="badges" element={<BadgesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppShell />
      <RewardToast />
    </StoreProvider>
  );
}
