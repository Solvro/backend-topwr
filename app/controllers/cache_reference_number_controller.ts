import { HttpContext } from "@adonisjs/core/http";
import db from "@adonisjs/lucid/services/db";

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
    await db.transaction(
      async (trx) => {
        const crn = await CacheReferenceNumber.query({
          client: trx,
        }).firstOrFail();
        crn.referenceNumber++;
        await crn.save();
      },
      { isolationLevel: "read committed" },
    );
  }
}
