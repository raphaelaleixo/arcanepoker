import {
  Box,
  Divider,
  Link,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { useSettings } from "../store/SettingsContext";

export function SettingsPage() {
  const {
    musicEnabled,
    sfxEnabled,
    language,
    devMode,
    toggleMusic,
    toggleSfx,
    setLanguage,
    toggleDevMode,
  } = useSettings();

  return (
    <Box
      sx={{
        maxWidth: 480,
        mx: "auto",
        p: 3,
      }}
    >
      <Typography
        variant="h4"
        sx={{
          fontFamily: "Young Serif, serif",
          color: "gold.light",
          mb: 3,
        }}
      >
        Settings
      </Typography>

      {/* Sound */}
      <Typography
        variant="overline"
        sx={{ color: "silver.dark", display: "block", mb: 1 }}
      >
        Sound
      </Typography>
      <Stack useFlexGap spacing={0}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="body2" sx={{ color: "silver.light" }}>
            Music
          </Typography>
          <Switch checked={musicEnabled} onChange={toggleMusic} />
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="body2" sx={{ color: "silver.light" }}>
            Sound Effects
          </Typography>
          <Switch checked={sfxEnabled} onChange={toggleSfx} />
        </Box>
      </Stack>

      <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.08)" }} />

      {/* Language */}
      <Typography
        variant="overline"
        sx={{ color: "silver.dark", display: "block", mb: 1 }}
      >
        Language
      </Typography>
      <Stack useFlexGap spacing={0}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="body2" sx={{ color: "silver.light" }}>
            Português (BR)
          </Typography>
          <Switch
            checked={language === "pt-br"}
            onChange={() =>
              setLanguage(language === "en" ? "pt-br" : "en")
            }
          />
        </Box>
      </Stack>

      <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.08)" }} />

      {/* Developer */}
      <Typography
        variant="overline"
        sx={{ color: "silver.dark", display: "block", mb: 1 }}
      >
        Developer
      </Typography>
      <Stack useFlexGap spacing={0}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="body2" sx={{ color: "silver.light" }}>
            Dev Mode
          </Typography>
          <Switch checked={devMode} onChange={toggleDevMode} />
        </Box>
        <Typography variant="caption" sx={{ color: "silver.dark" }}>
          Enables the Playground panel during gameplay
        </Typography>
      </Stack>

      <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.08)" }} />

      {/* Credits */}
      <Typography
        variant="overline"
        sx={{ color: "silver.dark", display: "block", mb: 1 }}
      >
        Credits
      </Typography>
      <Stack useFlexGap spacing={1}>
        <Typography variant="body2" sx={{ color: "silver.light" }}>
          Arcane Poker by{" "}
          <Link
            href="https://aleixo.me"
            target="_blank"
            rel="noopener noreferrer"
          >
            Raphael Aleixo / Ludoratory
          </Link>
        </Typography>
        <Typography variant="body2" sx={{ color: "silver.light" }}>
          Licensed under{" "}
          <Link
            href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
            target="_blank"
            rel="noopener noreferrer"
          >
            CC BY-NC-SA 4.0
          </Link>
        </Typography>
        <Typography variant="body2" sx={{ color: "silver.light" }}>
          Found a bug?{" "}
          <Link
            href="https://github.com/raphaelaleixo/arcanepoker/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            Report it on GitHub
          </Link>
        </Typography>

        <Typography
          variant="overline"
          sx={{ color: "silver.dark", display: "block", mt: 1 }}
        >
          Sound Credits
        </Typography>
        <Typography variant="caption" sx={{ color: "silver.dark" }}>
          {/* Add sound attribution entries here */}
        </Typography>
      </Stack>
    </Box>
  );
}
