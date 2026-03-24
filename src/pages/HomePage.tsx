import type { ElementType } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <Box
      sx={{
        position: "relative",
        "&:before": {
          content: "''",
          position: "absolute",
          inset: "1.25em -3em",
          border: "1px solid",
          borderColor: "darkSuit.main",
          borderRadius: 3,
          opacity: 1,
          transition: "all 0.3s ease-in-out",
        },
        "&:after": {
          content: "''",
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          height: "100%",
          width: "40%",
          background: "#242424",
        },
      }}
    >
      <Stack
        sx={{
          alignItems: "center",
          position: "relative",
          zIndex: 1,
          "&:before, &:after": {
            content: "''",
            display: "block",
            width: "15em",
            aspectRatio: "69/56",
            backgroundImage: "url(art/background.svg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          },
          "&:after": {
            transform: "rotate(180deg)",
          },
        }}
      >
        <Stack sx={{ pt: 3, pb: 2 }} spacing={1} useFlexGap>
          <Typography
            variant="h1"
            sx={{
              textAlign: "center",
              textBox: "trim-both ex alphabetic",
            }}
          >
            Arcane Poker
          </Typography>
          <Typography variant="body2">
            A{" "}
            <Typography variant="body2" component="span" fontStyle="italic">
              major
            </Typography>{" "}
            twist to playing Texas Hold'em
          </Typography>
          <Stack
            direction="column"
            gap={1}
            sx={{ justifyContent: "center", mt: 1 }}
          >
            <Button
              variant="contained"
              component={Link as ElementType}
              to="game"
              size="small"
            >
              start new game
            </Button>
            <Button
              variant="outlined"
              component={Link as ElementType}
              size="small"
              to="/tutorial"
            >
              tutorial
            </Button>
            <Button
              variant="outlined"
              component={Link as ElementType}
              size="small"
              to="/rules"
            >
              learn to play
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}
//     <Box
//       sx={{
//         minHeight: "100vh",
//         display: "flex",
//         flexDirection: "column",
//         alignItems: "center",
//         justifyContent: "center",
//         background:
//           "radial-gradient(ellipse at center, #0F3D20 0%, #0A2F1A 70%, #061a0f 100%)",
//         gap: 4,
//       }}
//     >
//       <Typography
//         variant="h2"
//         sx={{
//           fontFamily: '"Georgia", "Times New Roman", serif',
//           color: "gold.main",
//           textShadow: "0 0 20px rgba(255,215,0,0.5)",
//           letterSpacing: "0.1em",
//           textAlign: "center",
//         }}
//       >
//         Arcane Poker
//       </Typography>
//       <Typography
//         variant="h6"
//         sx={{
//           color: "silver.light",
//           opacity: 0.7,
//           fontStyle: "italic",
//           textAlign: "center",
//         }}
//       >
//         Where the Major Arcana shape your fate
//       </Typography>
//       <Stack direction="row" spacing={2} mt={2}>
//         <Button
//           component={Link as ElementType}
//           to="/game"
//           variant="contained"
//           size="large"
//           sx={{
//             px: 6,
//             py: 1.5,
//             fontSize: "1.2rem",
//             background: "linear-gradient(135deg, #2E7D32, #1B5E20)",
//             border: "2px solid",
//             borderColor: "gold.dark",
//             color: "gold.light",
//             "&:hover": {
//               background: "linear-gradient(135deg, #388E3C, #2E7D32)",
//               borderColor: "gold.main",
//             },
//           }}
//         >
//           Play
//         </Button>
//         <Button
//           component={Link as ElementType}
//           to="/rules"
//           variant="outlined"
//           size="large"
//           sx={{
//             px: 6,
//             py: 1.5,
//             fontSize: "1.2rem",
//             borderColor: "gold.dark",
//             color: "gold.light",
//             "&:hover": {
//               borderColor: "gold.main",
//               background: "rgba(255,215,0,0.05)",
//             },
//           }}
//         >
//           Rules
//         </Button>
//       </Stack>
//     </Box>
//   );
// }
