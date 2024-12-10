import Building from '#models/building'
import { showValidator, indexValidator, byCampusValidator } from '#validators/building'
import { HttpContext } from '@adonisjs/core/http'

export default class BuildingsController {
  /**
   * Display a list of resource
   */
  async index({ request, response }: HttpContext) {
    const { page, limit, includeCampus } = await request.validateUsing(indexValidator)

    const buildingsQuery = Building.query()
    const message = 'List of buildings'

    if (includeCampus) {
      buildingsQuery.preload('campus')
    }

    if (page) {
      const buildings = await buildingsQuery.paginate(page, limit || 10)
      return response.status(200).json({
        message: message,
        meta: buildings.getMeta(),
        data: buildings.toJSON().data,
      })
    }

    const buildings = await buildingsQuery
    return response.status(200).json({
      message: message,
      data: buildings,
    })
  }

  /**
   * Show individual record
   */
  async show({ request, response }: HttpContext) {
    const {
      params: { id },
    } = await request.validateUsing(showValidator)
    const building = await Building.find(id)

    return response.status(200).json({
      message: `Building with id: ${id}`,
      data: building,
    })
  }

  /**
   * Show individual record
   */
  async getByCampus({ request, response }: HttpContext) {
    const {
      params: { campusId },
      page,
      limit,
      includeCampus,
    } = await request.validateUsing(byCampusValidator)

    const buildingsQuery = Building.query().where('campus_id', campusId)
    const message = `List of buildings within campus of id: ${campusId}`

    if (includeCampus) {
      buildingsQuery.preload('campus')
    }

    if (page) {
      const buildings = await buildingsQuery.paginate(page, limit || 10)
      return response.status(200).json({
        message: message,
        meta: buildings.getMeta(),
        data: buildings.toJSON().data,
      })
    }

    const buildings = await buildingsQuery
    return response.status(200).json({
      message: message,
      data: buildings,
    })
  }
}
