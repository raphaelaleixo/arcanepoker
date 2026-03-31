import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { GamePage } from "./pages/GamePage";
import { HomePage } from "./pages/HomePage";
import { RulesPage } from "./pages/RulesPage";
import { TutorialGamePage } from "./pages/TutorialGamePage";
// import { NavFab } from "./components/NavFab";

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
  // const location = useLocation();

  return (
    <Suspense>
      {/* {location.pathname !== "/" && <NavFab />} */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/tutorial" element={<TutorialGamePage />} />
        <Route path="/rules" element={<RulesPage />} />
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
