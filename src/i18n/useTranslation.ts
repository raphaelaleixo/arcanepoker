import { useCallback } from "react";
import { useSettings } from "../store/SettingsContext";
import type { TranslationKey } from "./types";
import en from "./locales/en.json";
import ptBr from "./locales/pt-br.json";

// Compile-time check: pt-br must match en's shape
const _typeCheck: typeof en = ptBr;
void _typeCheck;

const locales = { en, "pt-br": ptBr } as const;

type InterpolationValues = Record<string, string | number>;

function getNestedValue(obj: unknown, path: string): string | undefined {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj) as string | undefined;
}

function interpolate(template: string, values?: InterpolationValues): string {
  if (!values) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    values[key] !== undefined ? String(values[key]) : `{{${key}}}`,
  );
}

export function useTranslation() {
  const { language } = useSettings();
  const messages = locales[language];

  const t = useCallback(
    (key: TranslationKey, values?: InterpolationValues): string => {
      const value = getNestedValue(messages, key);
      if (value === undefined) {
        if (import.meta.env.DEV) {
          console.warn(`[i18n] Missing key: "${key}" for locale "${language}"`);
        }
        return getNestedValue(en, key) ?? key;
      }
      return interpolate(value, values);
    },
    [language, messages],
  );

  return { t, language };
}
