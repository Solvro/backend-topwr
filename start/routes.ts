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

    // fetches campuses specifically
    router.get('/campuses/:id', [BuildingsController, 'getByCampus'])
    router.get('/campuses', [BuildingsController, 'getCampuses'])

    // fetches buildings specifically
    router.get('in-campus/:id', [BuildingsController, 'getByCampus'])
    router.get('/:id', [BuildingsController, 'getById'])
    router.get('/', [BuildingsController, 'getAll'])
  })
  .prefix('api/v1/buildings')