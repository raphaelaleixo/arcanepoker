import { Box, Divider, Stack, Typography } from "@mui/material";
import { useTranslation } from "../i18n";
import type { TranslationKey } from "../i18n";

const ARCANA_KEYS: { nameKey: TranslationKey; effectKey: TranslationKey }[] =
  Array.from({ length: 22 }, (_, i) => ({
    nameKey: `arcana.${i}.name` as TranslationKey,
    effectKey: `arcana.${i}.effect` as TranslationKey,
  }));

interface RulesPanelProps {
  hideTitle?: boolean;
}

export function RulesPanel({ hideTitle }: RulesPanelProps) {
  const { t } = useTranslation();

  return (
    <Stack useFlexGap spacing={4} maxWidth={720} mx="auto">
      {!hideTitle && (
        <Typography
          variant="h3"
          sx={{
            color: "gold.main",
          }}
        >
          {t("rules.howToPlay")}
        </Typography>
      )}

      <Typography
        variant="body1"
        sx={{ color: "silver.light", opacity: 0.8 }}
      >
        {t("rules.intro")}
      </Typography>

      {/* Section 1: The Page Card */}
      <Stack useFlexGap spacing={1.5}>
        <Typography variant="h5" sx={{ color: "gold.light" }}>
          {t("rules.pageCardTitle")}
        </Typography>
        <Divider sx={{ borderColor: "gold.dark", opacity: 0.4 }} />
        <Typography
          variant="body1"
          sx={{ color: "silver.light" }}
          dangerouslySetInnerHTML={{ __html: t("rules.pageCardDesc1") }}
        />
        <Typography
          variant="body1"
          sx={{ color: "silver.light" }}
          dangerouslySetInnerHTML={{ __html: t("rules.pageCardBoardTrigger") }}
        />
        <Typography
          variant="body1"
          sx={{ color: "silver.light" }}
          dangerouslySetInnerHTML={{ __html: t("rules.pageCardShowdownBonus") }}
        />
      </Stack>

      {/* Section 2: Hand Rankings */}
      <Stack useFlexGap spacing={1.5}>
        <Typography variant="h5" sx={{ color: "gold.light" }}>
          {t("rules.handRankingsTitle")}
        </Typography>
        <Divider sx={{ borderColor: "gold.dark", opacity: 0.4 }} />
        <Typography
          variant="body1"
          sx={{ color: "silver.light", opacity: 0.8 }}
        >
          <span dangerouslySetInnerHTML={{ __html: t("rules.handRankingsDesc") }} />{" "}
          <Typography
            component="a"
            href="http://datagenetics.com/blog/september22016/index.html"
            target="_blank"
            rel="noopener noreferrer"
            variant="body1"
            sx={{
              color: "gold.light",
              opacity: 0.7,
              "&:hover": { opacity: 1 },
            }}
          >
            {t("rules.reference")}
          </Typography>
        </Typography>
        <Box sx={{ display: "flex", gap: { xs: 1, sm: 2 }, pl: 3, mb: 0.5 }}>
          <Typography
            variant="caption"
            sx={{
              color: "silver.light",
              opacity: 0.4,
              minWidth: { xs: 110, sm: 160 },
              flexShrink: 0,
            }}
          >
            {t("rules.tableHand")}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "silver.light",
              opacity: 0.4,
              minWidth: { xs: 0, sm: 80 },
              flexShrink: 0,
              display: { xs: "none", sm: "block" },
            }}
          >
            {t("rules.tableStandard")}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "silver.light",
              opacity: 0.4,
              minWidth: { xs: 70, sm: 80 },
              flexShrink: 0,
            }}
          >
            {t("rules.tableArcane")}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "silver.light", opacity: 0.4 }}
          >
            {t("rules.tableChange")}
          </Typography>
        </Box>
        <Box
          component="ol"
          sx={{
            m: 0,
            pl: 3,
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
            "& li::marker": { fontFamily: "Rubik, sans-serif" },
          }}
        >
          {([
            {
              rankKey: "handRanks.straight-flush" as TranslationKey,
              standard: "0.0015%",
              arcane: "0.0011%",
              note: "-25.16%",
            },
            {
              rankKey: "handRanks.four-of-a-kind" as TranslationKey,
              standard: "0.0240%",
              arcane: "0.0190%",
              note: "-20.62%",
            },
            {
              rankKey: "handRanks.full-house" as TranslationKey,
              standard: "0.1440%",
              arcane: "0.1143%",
              note: "-20.62%",
            },
            {
              rankKey: "handRanks.straight" as TranslationKey,
              standard: "0.3924%",
              arcane: "0.2937%",
              note: "-25.16%",
            },
            {
              rankKey: "handRanks.flush" as TranslationKey,
              standard: "0.1965%",
              arcane: "0.2084%",
              note: "+6.08%",
            },
            {
              rankKey: "handRanks.three-of-a-kind" as TranslationKey,
              standard: "2.1128%",
              arcane: "1.8296%",
              note: "-13.41%",
            },
            {
              rankKey: "handRanks.two-pair" as TranslationKey,
              standard: "4.7539%",
              arcane: "4.1166%",
              note: "-13.41%",
            },
            {
              rankKey: "handRanks.pair" as TranslationKey,
              standard: "42.2569%",
              arcane: "40.2515%",
              note: "-4.75%",
            },
            {
              rankKey: "handRanks.high-card" as TranslationKey,
              standard: "50.1177%",
              arcane: "53.1653%",
              note: "+6.08%",
            },
          ] as const).map(({ rankKey, standard, arcane, note }) => (
            <Box
              component="li"
              key={rankKey}
              sx={{ color: "silver.light", fontSize: "0.875rem" }}
            >
              <Box
                sx={{
                  display: "flex",
                  gap: { xs: 1, sm: 2 },
                  alignItems: "center",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "silver.light",
                    minWidth: { xs: 110, sm: 160 },
                    flexShrink: 0,
                  }}
                >
                  {t(rankKey)}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "silver.light",
                    opacity: 0.5,
                    minWidth: { xs: 0, sm: 80 },
                    flexShrink: 0,
                    fontVariantNumeric: "tabular-nums",
                    display: { xs: "none", sm: "block" },
                  }}
                >
                  {standard}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "silver.light",
                    opacity: 0.7,
                    minWidth: { xs: 70, sm: 80 },
                    flexShrink: 0,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {arcane}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: note.startsWith("+")
                      ? "success.main"
                      : "error.main",
                    fontVariantNumeric: "tabular-nums",
                    opacity: 0.8,
                  }}
                >
                  {note}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Stack>

      {/* Section 3: The Major Arcana Deck */}
      <Stack useFlexGap spacing={1.5}>
        <Typography variant="h5" sx={{ color: "gold.light" }}>
          {t("rules.majorArcanaTitle")}
        </Typography>
        <Divider sx={{ borderColor: "gold.dark", opacity: 0.4 }} />
        <Typography
          variant="body1"
          sx={{ color: "silver.light" }}
          dangerouslySetInnerHTML={{ __html: t("rules.majorArcanaSetup") }}
        />
        <Typography variant="body1" sx={{ color: "silver.light" }}>
          {t("rules.majorArcanaDraw")}
        </Typography>

        <Box
          component="ol"
          start={0}
          sx={{
            m: 0,
            pl: 3,
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
            "& li::marker": { fontFamily: "Rubik, sans-serif" },
          }}
        >
          {ARCANA_KEYS.map(({ nameKey, effectKey }) => (
            <Box
              component="li"
              key={nameKey}
              sx={{ color: "silver.light", fontSize: "0.875rem" }}
            >
              <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: "silver.light",
                    minWidth: { xs: 120, sm: 200 },
                    flexShrink: 0,
                  }}
                >
                  {t(nameKey)}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "silver.light", opacity: 0.8, minWidth: 0 }}
                >
                  {t(effectKey)}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Stack>
    </Stack>
  );
}
