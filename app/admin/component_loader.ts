import { ComponentLoader } from "adminjs";
import path from "node:path";

export const componentLoader = new ComponentLoader();

export const Components = {
  Dashboard: componentLoader.add(
    "Dashboard",
    path.resolve(import.meta.dirname, "./components/dashboard"),
  ),
  PhotoDropbox: componentLoader.add(
    "PhotoDropbox",
    path.resolve(import.meta.dirname, "./components/photo_dropbox"),
  ),
  PhotoDisplay: componentLoader.add(
    "PhotoDisplay",
    path.resolve(import.meta.dirname, "./components/photo_display"),
  ),
  TimezoneDatepicker: componentLoader.add(
    "TimezoneDatepicker",
    path.resolve(import.meta.dirname, "./components/timezone_datepicker"),
  ),
};
