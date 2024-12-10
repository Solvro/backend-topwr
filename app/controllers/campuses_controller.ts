import Campus from '#models/campus'
import { indexValidator, showValidator } from '#validators/campus'
import type { HttpContext } from '@adonisjs/core/http'

export default class CampusesController {
  /**
   * Display a list of resource
   */
  async index({ request, response }: HttpContext) {
    const { includeBuildings } = await request.validateUsing(indexValidator)

    const campusesQuery = Campus.query()
    const message = 'List of campuses'

    if (includeBuildings) {
      campusesQuery.preload('buildings')
    }

    const campuses = await campusesQuery
    return response.status(200).json({
      message: message,
      data: campuses,
    })
  }

  /**
   * Show individual record
   */
  async show({ request, response }: HttpContext) {
    const {
      params: { id },
      includeBuildings,
    } = await request.validateUsing(showValidator)

    const campusQuery = Campus.query().where('id', id)

    if (includeBuildings) {
      campusQuery.preload('buildings')
    }

    const [campus] = await campusQuery
    return response.status(200).json({
      message: `Campus with id: ${id}`,
      data: campus,
    })
  }
}
