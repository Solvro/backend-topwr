import AutoCrudController from "#controllers/auto_crud_controller";
import Campus from "#models/campus";

export default class CampusesController extends AutoCrudController<
  typeof Campus
> {
  protected readonly queryRelations = [
    "buildings",
    "buildings.cover",
    "buildings.aeds",
    "buildings.aeds.photo",
    "buildings.bicycleShowers",
    "buildings.bicycleShowers.photo",
    "buildings.foodSpots",
    "buildings.foodSpots.photo",
    "buildings.libraries",
    "buildings.libraries.photo",
    "buildings.libraries.regularHours",
    "buildings.libraries.specialHours",
  ];
  protected readonly crudRelations = ["buildings"];
  protected readonly model = Campus;
}
