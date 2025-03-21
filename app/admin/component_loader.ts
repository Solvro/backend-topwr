import { ComponentLoader } from "adminjs";

export const componentLoader = new ComponentLoader();

export const Components = {
  Dashboard: componentLoader.add("Dashboard", "./components/dashboard"),
  PhotoDropbox: componentLoader.add(
    "PhotoDropbox",
    "./components/photo_dropbox",
  ),
  PhotoDisplay: componentLoader.add(
    "PhotoDisplay",
    "./components/photo_display",
  ),
};
