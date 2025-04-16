import { AdminJSProviderConfig } from "@adminjs/adonis";

import authProvider from "../app/admin/auth.js";
import { branding } from "../app/admin/branding.js";
import { Components, componentLoader } from "../app/admin/component_loader.js";
import { locale } from "../app/admin/locale/locale.js";
import { adminJsResources } from "../app/admin/resources/resource_index.js";

const adminjsConfig: AdminJSProviderConfig = {
  adapter: {
    enabled: true,
  },
  adminjs: {
    rootPath: "/admin",
    loginPath: "/admin/login",
    logoutPath: "/admin/logout",
    componentLoader,
    resources: adminJsResources,
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
      defaultPerPage: 50,
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
