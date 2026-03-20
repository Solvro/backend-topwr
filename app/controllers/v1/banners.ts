import { DateTime } from "luxon";

import type {
  CreateHookContext,
  HookContext,
  PartialModel,
} from "#controllers/auto_crud_controller";
import AutoCrudController from "#controllers/auto_crud_controller";
import { BadRequestException } from "#exceptions/http_exceptions";
import Banner from "#models/banner";

export default class BannerController extends AutoCrudController<
  typeof Banner
> {
  protected readonly queryRelations = [];
  protected readonly crudRelations = [];
  protected readonly model = Banner;

  protected async storeHook(
    ctx: CreateHookContext<typeof Banner>,
  ): Promise<PartialModel<typeof Banner> | void | undefined> {
    if (
      ctx.request.visibleFrom instanceof DateTime &&
      ctx.request.visibleUntil instanceof DateTime &&
      ctx.request.visibleFrom >= ctx.request.visibleUntil
    ) {
      throw new BadRequestException(
        "visibleUntil must be after visibleFrom if both are set",
      );
    }
    return undefined;
  }

  protected async updateHook(
    ctx: HookContext<typeof Banner>,
  ): Promise<PartialModel<typeof Banner> | void | undefined> {
    const startTime =
      ctx.request.visibleFrom === null
        ? null
        : (ctx.request.visibleFrom ?? ctx.record.visibleFrom);
    const endTime =
      ctx.request.visibleUntil === null
        ? null
        : (ctx.request.visibleUntil ?? ctx.record.visibleUntil);

    if (
      startTime instanceof DateTime &&
      endTime instanceof DateTime &&
      startTime >= endTime
    ) {
      throw new BadRequestException(
        "visibleUntil must be after visibleFrom if both are set",
      );
    }
    return undefined;
  }
}
