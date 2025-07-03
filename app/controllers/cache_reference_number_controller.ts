import { HttpContext } from "@adonisjs/core/http";

import CacheReferenceNumber from "#models/cache_reference_number";

export default class CacheReferenceNumberController {
  async index() {
    const cacheRefNum = await CacheReferenceNumber.query().first();
    return {
      data: {
        cacheRefNum,
      },
    };
  }

  async bump({ auth }: HttpContext) {
    if (!auth.isAuthenticated) {
      await auth.authenticate();
    }
    await CacheReferenceNumber.query().increment("reference_number", 1);
  }
}
