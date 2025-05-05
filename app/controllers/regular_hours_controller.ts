import RegularHour from "#models/regular_hour";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class RegularHoursController extends BaseController<
  typeof RegularHour
> {
  protected readonly queryRelations = ["library"];
  protected readonly crudRelations = [];
  protected readonly model = RegularHour;
}
