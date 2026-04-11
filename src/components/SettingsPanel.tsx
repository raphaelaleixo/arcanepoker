import { Link, Stack, Typography } from "@mui/material";
import { useSettings } from "../store/SettingsContext";
import { SettingSection } from "./SettingSection";
import { SettingToggle } from "./SettingToggle";

export function SettingsPanel() {
  const {
    musicEnabled,
    sfxEnabled,
    language,
    devMode,
    playedTutorial,
    toggleMusic,
    toggleSfx,
    setLanguage,
    toggleDevMode,
    togglePlayedTutorial,
  } = useSettings();

  return (
    <>
      <SettingSection title="Sound" hideDivider>
        <Stack useFlexGap spacing={0}>
          <SettingToggle label="Music" checked={musicEnabled} onChange={toggleMusic} />
          <SettingToggle label="Sound Effects" checked={sfxEnabled} onChange={toggleSfx} />
        </Stack>
      </SettingSection>

      <SettingSection title="Language">
        <Stack useFlexGap spacing={0}>
          <SettingToggle
            label="Português (BR)"
            checked={language === "pt-br"}
            onChange={() => setLanguage(language === "en" ? "pt-br" : "en")}
          />
        </Stack>
      </SettingSection>

      <SettingSection title="Gameplay">
        <Stack useFlexGap spacing={0}>
          <SettingToggle
            label="Played Tutorial"
            checked={playedTutorial}
            onChange={togglePlayedTutorial}
          />
          <Typography variant="caption" sx={{ color: "silver.dark" }}>
            Turn off to replay the tutorial on next game start
          </Typography>
        </Stack>
      </SettingSection>

      <SettingSection title="Developer">
        <Stack useFlexGap spacing={0}>
          <SettingToggle label="Dev Mode" checked={devMode} onChange={toggleDevMode} />
          <Typography variant="caption" sx={{ color: "silver.dark" }}>
            Enables the Playground panel during gameplay
          </Typography>
        </Stack>
      </SettingSection>

      <SettingSection title="Credits">
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
      </SettingSection>
    </>
  );
}
