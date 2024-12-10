/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import env from '#start/env'
import router from '@adonisjs/core/services/router'

const FilesController = () => import('#controllers/files_controller')
const BuildingsController = () => import('#controllers/buildings_controller')
const CampusesController = () => import('#controllers/campuses_controller')

router.get('/', async () => {
  return { appName: env.get('APP_NAME'), version: env.get('APP_VERSION') }
})

router
  .group(() => {
    router.get('/:key', [FilesController, 'get'])
    router.post('/', [FilesController, 'post'])
  })
  .prefix('api/v1/files')

router
  .group(() => {
    router.get('/:id', [CampusesController, 'show'])
    router.get('/', [CampusesController, 'index'])
  })
  .prefix('api/v1/campuses')

router
  .group(() => {
    router.get('in-campus/:campusId', [BuildingsController, 'getByCampus'])
    router.get('/:id', [BuildingsController, 'show'])
    router.get('/', [BuildingsController, 'index'])
  })
  .prefix('api/v1/buildings')
