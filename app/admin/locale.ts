import { CurrentAdmin, Locale, LocaleTranslations } from "adminjs";

export const locale:
  | Locale
  | ((admin?: CurrentAdmin) => Locale | Promise<Locale>) = {
  language: "en",
  translations: {
    en: {
      components: {
        Login: {
          welcomeHeader: "Elo żelo!",
          welcomeMessage: "Witamy w panelu administracyjnym ToPWR by Solvro",
        },
      },
      labels: {},
      actions: {
        new: "Stwórz nowy",
        edit: "Edytuj",
        show: "Szczegóły",
        delete: "Usuń",
        list: "Lista",
        filter: "Filtruj",
        filters: "Filtry",
      },
      buttons: {
        save: "Zapisz",
        confirmRemovalMany_1: "Potwierdź usunięcie {{count}} rekordu",
        confirmRemovalMany_2: "Potwierdź usunięcie {{count}} rekordów",
        applyChanges: "Zastosuj zmiany",
        reset: "Resetuj",
        filter: "Filtruj",
        logOut: "Wyloguj się",
        createFirstRecord: "Stwórz pierwszy rekord",
      },
      properties: {},
    } as LocaleTranslations,
  },
};
