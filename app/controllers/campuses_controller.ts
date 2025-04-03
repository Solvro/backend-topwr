import Campus from "#models/campus";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class CampusesController extends BaseController<typeof Campus> {
  protected readonly relations = [
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
  protected readonly model = Campus;
}
