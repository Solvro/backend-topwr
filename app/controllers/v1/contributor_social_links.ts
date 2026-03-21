import AutoCrudController from "#controllers/auto_crud_controller";
import ContributorSocialLink from "#models/contributor_social_link";

export default class ContributorSocialLinksController extends AutoCrudController<
  typeof ContributorSocialLink
> {
  protected readonly queryRelations = ["contributor"];
  protected readonly crudRelations = [];
  protected readonly model = ContributorSocialLink;
}
