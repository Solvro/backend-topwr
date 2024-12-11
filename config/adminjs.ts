import { AdminJSProviderConfig } from "@adminjs/adonis";

import authProvider from "../app/admin/auth.js";
import componentLoader from "../app/admin/component_loader.js";
import { adminjsResources } from "../app/admin/resources/index.js";

const adminjsConfig: AdminJSProviderConfig = {
  adapter: {
    enabled: true,
  },
  adminjs: {
    rootPath: "/admin",
    loginPath: "/admin/login",
    logoutPath: "/admin/logout",
    componentLoader,
    resources: adminjsResources,
    pages: {},
    locale: {
      availableLanguages: ["en"],
      language: "en",
      translations: {
        en: {
          actions: {},
          messages: {},
          labels: {},
          buttons: {},
          properties: {},
          components: {},
          pages: {},
          ExampleResource: {
            actions: {},
            messages: {},
            labels: {},
            buttons: {},
            properties: {},
          },
        },
      },
    },
    branding: {
      companyName: "Solvro",
      theme: {},
    },
    settings: {
      defaultPerPage: 10,
    },
  },
  auth: {
    enabled: true,
    provider: authProvider,
    middlewares: [],
  },
  middlewares: [],
};

export default adminjsConfig;
