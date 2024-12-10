import vine from '@vinejs/vine'

/**
 * Validates the index reqest
 */
export const indexValidator = vine.compile(
  vine.object({
    page: vine.number().min(1).optional(),
    limit: vine.number().min(1).optional(),
    includeCampus: vine.boolean().optional(),
  })
)

/**
 * Validates the show reqest
 */
export const showValidator = vine.compile(
  vine.object({
    params: vine.object({
      id: vine
        .number()
        .min(0)
        .exists(async (db, value) => {
          const id = await db.from('buildings').select('id').where('id', value).first()
          return id
        }),
    }),
  })
)

/**
 * Validates the getByCampus reqest
 */
export const byCampusValidator = vine.compile(
  vine.object({
    params: vine.object({
      campusId: vine
        .number()
        .min(0)
        .exists(async (db, value) => {
          const id = await db.from('campuses').select('id').where('id', value).first()
          return id !== undefined
        }),
    }),
    includeCampus: vine.boolean().optional(),
    page: vine.number().min(1).optional(),
    limit: vine.number().min(1).optional(),
  })
)
