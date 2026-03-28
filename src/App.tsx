import { Routes, Route, Navigate } from "react-router-dom";
import { GamePage } from "./pages/GamePage";
import { HomePage } from "./pages/HomePage";
import { RulesPage } from "./pages/RulesPage";
import { TutorialGamePage } from "./pages/TutorialGamePage";
import { DemoPage } from "./pages/DemoPage";
import { Demo2Page } from "./pages/Demo2Page";
import { Demo3Page } from "./pages/Demo3Page";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/game" element={<GamePage />} />
      <Route path="/tutorial" element={<TutorialGamePage />} />
      <Route path="/rules" element={<RulesPage />} />
      <Route path="/demo" element={<DemoPage />} />
      <Route path="/demo2" element={<Demo2Page />} />
      <Route path="/demo3" element={<Demo3Page />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
