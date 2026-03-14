// src/components/Card/DealtCard.tsx
import { keyframes } from '@emotion/react';
import { Box } from '@mui/material';
import type { SxProps } from '@mui/material';
import type { StandardCardValue, ArcanaValue, Suit, ArcanaSuit } from '../../types/types';
import { PlayingCard } from './PlayingCard';
import { useEffect, useState } from 'react';

const dealIn = keyframes`
  from { opacity: 0; transform: translateY(-40px) scale(0.85); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

interface DealtCardProps {
  rank?: StandardCardValue | ArcanaValue;
  suit?: Suit | ArcanaSuit;
  small?: boolean;
  flipped?: boolean;
  shade?: boolean;
  sx?: SxProps;
  /** Position in the current deal batch — controls stagger delay (dealIndex × 80ms). Defaults to 0. */
  dealIndex?: number;
  /**
   * When set, the card starts face-down on mount and flips after this many ms.
   * Use this for community cards: revealDelay = dealIndex * 80 + 400
   */
  revealDelay?: number;
}

export function DealtCard({
  dealIndex = 0,
  revealDelay,
  flipped,
  sx,
  ...cardProps
}: DealtCardProps) {
  const [revealed, setRevealed] = useState(revealDelay === undefined ? (flipped ?? false) : false);

  useEffect(() => {
    if (revealDelay === undefined) return;
    const id = setTimeout(() => setRevealed(flipped ?? false), revealDelay);
    return () => clearTimeout(id);
  }, [revealDelay, flipped]);

  return (
    <Box
      sx={{
        animation: `${dealIn} 350ms cubic-bezier(0.34, 1.56, 0.64, 1) both`,
        animationDelay: `${dealIndex * 80}ms`,
        display: 'inline-block',
      }}
    >
      <PlayingCard {...cardProps} flipped={revealed} sx={sx} />
    </Box>
  );
}
