import AutoCrudController from "#controllers/auto_crud_controller";
import Building from "#models/building";

export default class BuildingsController extends AutoCrudController<
  typeof Building
> {
  protected readonly queryRelations = [
    "cover",
    "campus",
    "campus.cover",
    "aeds",
    "aeds.photo",
    "bicycleShowers",
    "bicycleShowers.photo",
    "foodSpots",
    "foodSpots.photo",
    "libraries",
    "libraries.photo",
    "libraries.regularHours",
    "libraries.specialHours",
  ];
  protected readonly crudRelations = [
    "aeds",
    "bicycleShowers",
    "foodSpots",
    "libraries",
  ];
  protected readonly model = Building;
}
