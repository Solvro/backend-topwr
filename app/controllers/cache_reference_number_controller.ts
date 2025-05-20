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
}
