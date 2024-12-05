import Building from '#models/building'
import Campus from '#models/campus'
import { HttpContext } from '@adonisjs/core/http'

export default class BuildingsController {
  /**
   * Display a list of resource
   */
  async index({ response }: HttpContext) {
    try {
      const buildings = await Building.all()
      if (buildings.length === 0) {
        return response.status(400).json({ message: 'No buildings in database' })
      }
      return response.status(200).json(buildings)
    } catch (error) {
      return response
        .status(500)
        .json({ message: 'Failed to fetch buildings', error: error.message })
    }
  }
  /**
   * Handle form submission for the edit action
   */
  async show({ request, response }: HttpContext) {
    try {
      const id = request.param('id')
      if (!id) {
        return response.status(404).json({ message: 'Building ID is required' })
      }
      const building = await Building.find(id)
      if (building) {
        return response.status(200).json(building)
      }
      return response.status(400).json({ message: `No building with id: ${id}` })
    } catch (error) {
      return response
        .status(500)
        .json({ message: 'Failed to fetch building by id', error: error.message })
    }
  }
  /**
   * Show individual record
   */
  async getByCampus({ request, response }: HttpContext) {
    try {
      const campusId = request.param('id')
      if (!campusId) return response.status(400).json({ message: 'campus ID is required' })

      const [campus, buildings] = await Promise.all([
        Campus.find(campusId),
        Building.query().where('campusId', campusId).paginate(1),
      ])

      if (!campus) return response.status(404).json({ message: 'Campus not found' })
      if (!buildings.length)
        return response.status(404).json({ message: 'No buildings with given campus id' })

      return response.status(200).json({
        campus: campus,
        buildings: buildings,
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Failed to fetch buildings by campus',
        error: error.message,
      })
    }
  }
}
