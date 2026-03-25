/**
 * Modal dialog for arcana interactions that require a multi-choice decision.
 *
 * All current interaction types are handled inline on the table (ActionBar / TableOverlayContent).
 * This component is retained as a shell for future modal-based interactions.
 */
import { useGame } from "../../store/useGame";

export function InteractionModal() {
  const { state } = useGame();
  const { pendingInteraction } = state;

  if (
    pendingInteraction === null ||
    pendingInteraction.type === "tarot-reading" ||
    pendingInteraction.type === "arcana-reveal" ||
    pendingInteraction.type === "page-challenge" ||
    pendingInteraction.type === "chariot-pass" ||
    pendingInteraction.type === "priestess-reveal" ||
    pendingInteraction.type === "temperance-pick" ||
    pendingInteraction.type === "magician-redraw" ||
    pendingInteraction.type === "star-discard"
  ) {
    return null;
  }

  return null;
}
