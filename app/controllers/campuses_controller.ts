import Campus from "#models/campus";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class CampusesController extends BaseController<typeof Campus> {
  protected readonly relations = [
    "buildings",
    "buildings.aeds",
    "buildings.bicycleShowers",
    "buildings.foodSpots",
    "buildings.libraries",
    "buildings.libraries.regularHours",
    "buildings.libraries.specialHours",
  ];
  protected readonly model = Campus;
}
