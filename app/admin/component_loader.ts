import { ComponentLoader } from "adminjs";

export const componentLoader = new ComponentLoader();

export const Components = {
  Dashboard: componentLoader.add("Dashboard", "./components/dashboard"),
};
