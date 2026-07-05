import { useTranslation } from "react-i18next";
import LegalDocument from "../components/LegalDocument";
import supportMarkdown from "../../legal/SUPPORT.md?raw";

export default function Support() {
  const { t } = useTranslation();
  return (
    <LegalDocument
      markdown={supportMarkdown}
      backTo="/"
      backLabel={t("legal.backHome")}
    />
  );
}
