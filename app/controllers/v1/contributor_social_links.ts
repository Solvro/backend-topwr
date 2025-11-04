import ContributorSocialLink from "#models/contributor_social_link";

const { default: BaseController } = await (() =>
  import("#controllers/base_controller"))();

export default class ContributorSocialLinksController extends BaseController<
  typeof ContributorSocialLink
> {
  protected readonly queryRelations = ["contributor"];
  protected readonly crudRelations = [];
  protected readonly model = ContributorSocialLink;
}
