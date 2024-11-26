# ToPWR Backend

![Solvro banner](https://github.com/Solvro/backend-topwr-sks/blob/main/assets/solvro_dark.png#gh-dark-mode-only)
![Solvro banner](https://github.com/Solvro/backend-topwr-sks/blob/main/assets/solvro_dark.png#gh-light-mode-only)

## Drive

### Theory

For storing files we use LocalFile System -> just folder in our environment.
Make sure that folder `storage` is added in gitignore and don't push it into github.

### How to use

```
import type { HttpContext } from '@adonisjs/core/http'
import drive from '@adonisjs/drive/services/main'

export default class PhotosController {
  async post({ request }: HttpContext) {
    const photo = request.file('photo')
    const key = `${new Date().getTime()}.${photo?.extname}`
    await photo?.moveToDisk(key)
    return key
  }

  async get({ params }: HttpContext) {
    const { key } = params
    return drive.use().getUrl(key)
  }
}
```
