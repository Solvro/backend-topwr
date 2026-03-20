import AutoCrudController from "#controllers/auto_crud_controller";
import Version from "#models/version";

export default class VersionsController extends AutoCrudController<
  typeof Version
> {
  protected readonly queryRelations = [
    "screenshots",
    "screenshots.image",
    "changes",
    "changes.screenshots",
    "changes.screenshots.image",
    "milestone",
  ];
  protected readonly crudRelations = ["screenshots", "changes"];
  protected readonly model = Version;
}
