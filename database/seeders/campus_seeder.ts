import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Campus from '#models/campus'

export default class CampusSeeder extends BaseSeeder {
  async run() {
    await Campus.createMany([
      {
        name: 'taki',
        cover: 'http://example.com',
      },
      {
        name: 'siaki',
        cover: 'http://example.com',
      },
      {
        name: 'i owaki',
        cover: 'http://example.com',
      },
    ])
  }
}
