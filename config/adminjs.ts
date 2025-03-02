import { AdminJSProviderConfig } from "@adminjs/adonis";

import authProvider from "../app/admin/auth.js";
import { branding } from "../app/admin/branding.js";
import { Components, componentLoader } from "../app/admin/component_loader.js";
import { locale } from "../app/admin/locale.js";
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
    assets: {
      styles: ["/main.css"],
    },
    locale,
    branding,
    dashboard: {
      component: Components.Dashboard,
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
