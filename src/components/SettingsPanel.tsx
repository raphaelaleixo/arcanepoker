import { Link, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useSettings } from "../store/SettingsContext";
import { useTranslation } from "../i18n";
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
  const { t } = useTranslation();

  return (
    <>
      <SettingSection title={t("settings.sound")} hideDivider>
        <Stack useFlexGap spacing={0}>
          <SettingToggle label={t("settings.music")} checked={musicEnabled} onChange={toggleMusic} />
          <SettingToggle label={t("settings.soundEffects")} checked={sfxEnabled} onChange={toggleSfx} />
        </Stack>
      </SettingSection>

      <SettingSection title={t("settings.language")}>
        <ToggleButtonGroup
          value={language}
          exclusive
          onChange={(_, value) => {
            if (value) setLanguage(value);
          }}
          color="primary"
          size="small"
          fullWidth
          sx={{
            "& .MuiToggleButton-root:not(.Mui-selected)": {
              color: "silver.light",
            },
          }}
        >
          <ToggleButton value="en">English</ToggleButton>
          <ToggleButton value="pt-br">Português</ToggleButton>
        </ToggleButtonGroup>
      </SettingSection>

      <SettingSection title={t("settings.gameplay")}>
        <Stack useFlexGap spacing={0}>
          <SettingToggle
            label={t("settings.playedTutorial")}
            checked={playedTutorial}
            onChange={togglePlayedTutorial}
          />
          <Typography variant="caption" sx={{ color: "silver.dark" }}>
            {t("settings.replayTutorialHint")}
          </Typography>
        </Stack>
      </SettingSection>

      <SettingSection title={t("settings.developer")}>
        <Stack useFlexGap spacing={0}>
          <SettingToggle label={t("settings.devMode")} checked={devMode} onChange={toggleDevMode} />
          <Typography variant="caption" sx={{ color: "silver.dark" }}>
            {t("settings.devModeHint")}
          </Typography>
        </Stack>
      </SettingSection>

      <SettingSection title={t("settings.credits")}>
        <Stack useFlexGap spacing={1}>
          <Typography variant="body2" sx={{ color: "silver.light" }}>
            {t("common.madeBy")}{" "}
            <Link
              href="https://aleixo.me"
              target="_blank"
              rel="noopener noreferrer"
            >
              Raphael Aleixo / Ludoratory
            </Link>
          </Typography>
          <Typography variant="body2" sx={{ color: "silver.light" }}>
            {t("common.licensedUnder")}{" "}
            <Link
              href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
              target="_blank"
              rel="noopener noreferrer"
            >
              CC BY-NC-SA 4.0
            </Link>
          </Typography>
          <Typography variant="body2" sx={{ color: "silver.light" }}>
            {t("settings.foundBug")}{" "}
            <Link
              href="https://github.com/raphaelaleixo/arcanepoker/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("settings.reportOnGithub")}
            </Link>
          </Typography>

          <Typography
            variant="overline"
            sx={{ color: "silver.dark", display: "block", mt: 1 }}
          >
            {t("settings.soundCredits")}
          </Typography>
          <Typography variant="caption" sx={{ color: "silver.dark" }}>
            {/* Add sound attribution entries here */}
          </Typography>
        </Stack>
      </SettingSection>
    </>
  );
}
