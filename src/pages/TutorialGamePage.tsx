// src/pages/TutorialGamePage.tsx
import { TutorialProvider } from "../tutorial/TutorialContext";
import { GamePage } from "./GamePage";

export function TutorialGamePage() {
  return (
    <TutorialProvider>
      <GamePage isTutorial />
    </TutorialProvider>
  );
}
