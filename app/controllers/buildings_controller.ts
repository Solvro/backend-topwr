import Building from "#models/building";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class BuildingsController extends BaseController<
  typeof Building
> {
  protected readonly relations = [
    "campus",
    "aeds",
    "bicycleShowers",
    "foodSpots",
    "libraries",
    "libraries.regularHours",
    "libraries.specialHours",
  ];
  protected readonly model = Building;
}
