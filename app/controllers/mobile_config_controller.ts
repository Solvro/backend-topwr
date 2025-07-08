import { HttpContext } from "@adonisjs/core/http";

import BaseController from "#controllers/base_controller";
import { BadRequestException } from "#exceptions/http_exceptions";
import MobileConfig from "#models/mobile_config";

export default class MobileConfigController extends BaseController<
  typeof MobileConfig
> {
  protected queryRelations: string[] = [];
  protected crudRelations: string[] = [];
  protected model: typeof MobileConfig = MobileConfig;

  async store(_: HttpContext): Promise<unknown> {
    throw new BadRequestException("Operation not supported for mobile config");
  }

  async destroy(_: HttpContext): Promise<unknown> {
    throw new BadRequestException("Operation not supported for mobile config");
  }

  async bump({ auth }: HttpContext) {
    if (!auth.isAuthenticated) {
      await auth.authenticate();
    }
    await MobileConfig.query().increment("reference_number", 1);
  }
}
