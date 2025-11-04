import SpecialHour from "#models/special_hour";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class SpecialHoursController extends BaseController<
  typeof SpecialHour
> {
  protected readonly queryRelations = ["library"];
  protected readonly crudRelations = [];
  protected readonly model = SpecialHour;
}
