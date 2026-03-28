import { Box, GlobalStyles, keyframes, SxProps } from "@mui/material";

const animateFoil = keyframes`
    from {
        --posx: 40%;
    }
    to {
        --posx: 80%;
    }
`;

const animateFoil2 = keyframes`
    from {
        --posy: 70%;
    }
    to {
        --posy: 30%;
    }
`;

const variables = {
  "--glow": "#69d1e9",
  "--radius": "['4.55% / 3.5%', '4.55% / 3.5%']",
  "--space": "2px",
  "--h": "21",
  "--s": "['70%', '1']",
  "--l": "50%",
  "--angle": "133deg",
  "--imgsize": "500px",
  "--red": "#f80e7b",
  "--yel": "#eedf10",
  "--gre": "#21e985",
  "--blu": "#0dbde9",
  "--vio": "#c929f1",
  "--mx": "50%",
  "--my": "50%",
  "--tx": "0px",
  "--ty": "0px",
  "--o": "1",
  "--rx": "0deg",
  "--ry": "0deg",
  "--pos": "50% 50%",
  "--posx": "50%",
  "--posy": "30%",
  "--hyp": "0.5",
  "--bars": "24px",
  "--bar-color": "rgba(255, 255, 255, 0.6)",
  "--bar-bg": "rgb(10, 10, 10)",
};

const isIOS =
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent);

const mainFilter = isIOS
  ? "brightness(calc((var(--hyp)*0.3) + 0.45)) contrast(1.65) saturate(1.3)"
  : "brightness(calc((var(--hyp)*0.3) + 0.5)) contrast(2) saturate(1.5)";

const afterFilter = isIOS
  ? "brightness(calc((var(--hyp)*0.4) + .72)) contrast(1.4) saturate(1.25)"
  : "brightness(calc((var(--hyp)*0.5) + .8)) contrast(1.6) saturate(1.4)";

const foilStyles: SxProps = {
  ...variables,
  "--space": "5%",
  "--angle": "133deg",
  "--imgsize": "60%",
  width: "100%",
  height: "100%",
  borderRadius: "var(--radius)",
  mixBlendMode: "color-dodge",
  backgroundImage:
    "url(/art/illusion.webp), repeating-linear-gradient( 0deg, rgb(255, 119, 115) calc(var(--space)*1), rgba(255,237,95,1) calc(var(--space)*2), rgba(168,255,95,1) calc(var(--space)*3), rgba(131,255,247,1) calc(var(--space)*4), rgba(120,148,255,1) calc(var(--space)*5), rgb(216, 117, 255) calc(var(--space)*6), rgb(255, 119, 115) calc(var(--space)*7) ), repeating-linear-gradient( var(--angle), #0e152e 0%, hsl(180, 10%, 60%) 3.8%, hsl(180, 29%, 66%) 4.5%, hsl(180, 10%, 60%) 5.2%, #0e152e 10% , #0e152e 12% ), radial-gradient( farthest-corner circle at var(--mx) var(--my), rgba(0, 0, 0, .1) 12%, rgba(0, 0, 0, .15) 20%, rgba(120, 120, 120, 0.25) 120% )",
  backgroundBlendMode: "exclusion, hue, hard-light, exclusion",
  backgroundSize: "var(--imgsize), 200% 700%, 300%, 200%",
  backgroundPosition:
    "center, 0% var(--posy), var(--posx) var(--posy), var(--posx) var(--posy)",
  filter: mainFilter,
  WebkitFilter: mainFilter,
  display: "grid",
  gridArea: "1/1",
  opacity: "var(--o)",
  animation: `${animateFoil} 4s infinite alternate`,
  "&:after": {
    content: '" "',
    visibility: "visible",
    "--space": "5%",
    "--angle": "133deg",
    "--imgsize": "50%",
    width: "100%",
    height: "100%",
    borderRadius: "var(--radius)",
    mixBlendMode: "exclusion",
    backgroundImage:
      "url(https://res.cloudinary.com/simey/image/upload/Dev/PokemonCards/illusion.webp), repeating-linear-gradient( 0deg, rgb(255, 119, 115) calc(var(--space)*1), rgba(255,237,95,1) calc(var(--space)*2), rgba(168,255,95,1) calc(var(--space)*3), rgba(131,255,247,1) calc(var(--space)*4), rgba(120,148,255,1) calc(var(--space)*5), rgb(216, 117, 255) calc(var(--space)*6), rgb(255, 119, 115) calc(var(--space)*7) ), repeating-linear-gradient( var(--angle), #0e152e 0%, hsl(180, 10%, 60%) 3.8%, hsl(180, 29%, 66%) 4.5%, hsl(180, 10%, 60%) 5.2%, #0e152e 10% , #0e152e 12% ), radial-gradient( farthest-corner circle at var(--mx) var(--my), rgba(0, 0, 0, .1) 12%, rgba(0, 0, 0, .15) 20%, rgba(0, 0, 0, .25) 120% )",
    backgroundBlendMode: "exclusion, hue, hard-light, exclusion",
    backgroundSize: "var(--imgsize), 200% 400%, 195%, 200%",
    backgroundPosition:
      "center, 0% var(--posy), calc( var(--posx) * -1) calc( var(--posy) * -1), var(--posx) var(--posy)",
    filter: afterFilter,
    WebkitFilter: afterFilter,
    display: "grid",
    gridArea: "1/1",
    animation: `${animateFoil2} 2s infinite alternate`,
  },
};

interface FoilProps {
  sx?: SxProps;
}

export const Foil = ({ sx }: FoilProps) => {
  return (
    <>
      <GlobalStyles
        styles={`
          @property --posx {
            syntax: '<percentage>';
            initial-value: 50%;
            inherits: false;
          }
          @property --posy {
            syntax: '<percentage>';
            initial-value: 50%;
            inherits: false;
          }
        `}
      />
      <Box
        sx={{
          ...foilStyles,
          ...sx,
        }}
      />
    </>
  );
};
