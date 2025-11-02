import SksOpeningHours from "#models/sks_opening_hours";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class SksOpeningHoursController extends BaseController<
  typeof SksOpeningHours
> {
  protected readonly queryRelations = [];
  protected readonly crudRelations = [];
  protected readonly model = SksOpeningHours;
}
