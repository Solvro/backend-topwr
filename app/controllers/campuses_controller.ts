import Campus from '#models/campus'
import type { HttpContext } from '@adonisjs/core/http'

export default class CampusesController {
  /**
   * Display a list of resource
   */
  async index({ response }: HttpContext) {
    try {
      const campuses = await Campus.all()
      if (!campuses.length) return response.status(400).json({ message: 'No campus in database' })
      return response.status(200).json(campuses)
    } catch (error) {
      return response.status(500).json({ message: 'Failed to fetch campuses' })
    }
  }
  /**
   * Show individual record
   */
  async show({ params, response }: HttpContext) {
    try {
      const id = params.id
      if (!id) return response.status(400).json({ message: 'campus ID is required' })

      const campus = await Campus.find(id)
      await campus?.load('buildings')
      if (!campus) return response.status(404).json({ message: 'Campus not found' })

      return response.status(200).json(campus)
    } catch (error) {
      return response.status(500).json({ message: 'Failed to fetch campus by Id' })
    }
  }
}
