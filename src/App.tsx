import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { NavFab } from "./components/NavFab";

const GamePage = lazy(() =>
  import("./pages/GamePage").then((m) => ({ default: m.GamePage })),
);
const TutorialGamePage = lazy(() =>
  import("./pages/TutorialGamePage").then((m) => ({
    default: m.TutorialGamePage,
  })),
);
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);

const demoEnabled = import.meta.env.VITE_ENABLE_DEMO === "true";

const DemoPage = demoEnabled
  ? lazy(() =>
      import("./pages/DemoPage").then((m) => ({ default: m.DemoPage })),
    )
  : null;
const Demo2Page = demoEnabled
  ? lazy(() =>
      import("./pages/Demo2Page").then((m) => ({ default: m.Demo2Page })),
    )
  : null;
const Demo3Page = demoEnabled
  ? lazy(() =>
      import("./pages/Demo3Page").then((m) => ({ default: m.Demo3Page })),
    )
  : null;

export default function App() {
  const location = useLocation();

  return (
    <Suspense>
      {location.pathname !== "/" && <NavFab />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/tutorial" element={<TutorialGamePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        {demoEnabled && DemoPage && (
          <Route path="/demo" element={<DemoPage />} />
        )}
        {demoEnabled && Demo2Page && (
          <Route path="/demo2" element={<Demo2Page />} />
        )}
        {demoEnabled && Demo3Page && (
          <Route path="/demo3" element={<Demo3Page />} />
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
