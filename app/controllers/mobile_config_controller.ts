import { HttpContext } from "@adonisjs/core/http";

import { BadRequestException } from "#exceptions/http_exceptions";
import MobileConfig from "#models/mobile_config";

export default class MobileConfigController {
  async index() {
    const mobileConfigSingleton = await MobileConfig.query().first();
    return {
      data: {
        mobileConfigSingleton,
      },
    };
  }

  async bump({ auth }: HttpContext) {
    if (!auth.isAuthenticated) {
      await auth.authenticate();
    }
    await MobileConfig.query().increment("reference_number", 1);
  }

  async updateCount({ request, auth }: HttpContext) {
    if (!auth.isAuthenticated) {
      await auth.authenticate();
    }
    const newCount = request.param("new_value") as string;
    const value = Number.parseFloat(newCount);
    if (Number.isNaN(value) || !Number.isInteger(value) || value <= 0) {
      throw new BadRequestException("Count must be a positive integer");
    }
    await MobileConfig.query().update("day_swap_lookahead", value);
  }
}
