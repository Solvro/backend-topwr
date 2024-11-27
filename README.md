# ToPWR Backend

![Solvro banner](https://github.com/Solvro/backend-topwr-sks/blob/main/assets/solvro_dark.png#gh-dark-mode-only)
![Solvro banner](https://github.com/Solvro/backend-topwr-sks/blob/main/assets/solvro_dark.png#gh-light-mode-only)

## Drive

### Theory

For storing files we use LocalFile System -> just folder in our environment.
Make sure that folder `storage` is added in gitignore and don't push it into github.

### How to use
To unify our style of using storage we have `FilesService`

```
import type { HttpContext } from '@adonisjs/core/http'

import FilesService from '#services/files_service'

export default class PhotosController {
  async post({ request, response }: HttpContext, filesService: FilesService) {
    const file = request.file('file')
    if (!file) {
      return response.badRequest('No file provided')
    }
    const key = await filesService.uploadFile(file)
    if (key instanceof Error) {
      return response.badRequest(key.message)
    }
    return response.status(201).send({ key })
  }

  async get({ params, response }: HttpContext, filesService: FilesService) {
    const { key } = params
    const url = await filesService.getFileUrl(key)
    if (url instanceof Error) {
      return response.badRequest(url.message)
    }
    return response.status(200).send({ url })
  }
}
```
