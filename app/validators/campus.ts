import vine from '@vinejs/vine'

/**
 * Validates the index query
 */
export const indexValidator = vine.compile(
  vine.object({
    includeBuildings: vine.boolean().optional(),
  })
)

/**
 * Validates the show query
 */
export const showValidator = vine.compile(
  vine.object({
    params: vine.object({
      id: vine
        .number()
        .min(0)
        .exists(async (db, value) => {
          const id = await db.from('campuses').select('id').where('id', value).first()
          return id
        }),
    }),
    includeBuildings: vine.boolean().optional(),
  })
)
