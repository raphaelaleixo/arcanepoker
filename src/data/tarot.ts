import tarotEn from "./tarot.en";
import tarotPtBr from "./tarot.pt-br";

const locales = { en: tarotEn, "pt-br": tarotPtBr } as const;

export default function getTarotData(language: "en" | "pt-br" = "en") {
  return locales[language];
}
