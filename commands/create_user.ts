import { args, BaseCommand } from '@adonisjs/core/ace'
import User from '#models/user'

export default class CreateUser extends BaseCommand {
  static commandName = 'create:user'
  static description = 'Create a new user in the system'

  @args.string({
    argumentName: 'email',
    description: 'Email address of the user',
  })
  declare email: string

  @args.string({
    argumentName: 'password',
    description: 'Password for the user',
  })
  declare password: string

  async run() {
    this.logger.info(`Creating user: ${this.email}`)
    await User.create({
      email: this.email,
      password: this.password,
    })
  }
}
