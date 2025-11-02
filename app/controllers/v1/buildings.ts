import Building from "#models/building";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class BuildingsController extends BaseController<
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
