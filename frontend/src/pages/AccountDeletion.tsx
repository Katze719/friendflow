import { useTranslation } from "react-i18next";
import LegalDocument from "../components/LegalDocument";
import accountDeletionMarkdown from "../../legal/ACCOUNT_DELETION.md?raw";

export default function AccountDeletion() {
  const { t } = useTranslation();
  return (
    <LegalDocument
      markdown={accountDeletionMarkdown}
      backTo="/"
      backLabel={t("legal.backHome")}
    />
  );
}
