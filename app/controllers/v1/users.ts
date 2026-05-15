import vine from "@vinejs/vine";

import { HttpContext } from "@adonisjs/core/http";
import router from "@adonisjs/core/services/router";
import { Constructor, LazyImport } from "@adonisjs/core/types/http";
import db from "@adonisjs/lucid/services/db";

import { ForbiddenException } from "#app/exceptions/http_exceptions";
import User from "#app/models/user";

import BaseController from "../base_controller.js";

//should check if email is unique and more conditions on password
const createUserValidator = vine.compile(
  vine.object({
    fullName: vine.string().optional(),
    email: vine.string().email(),
    password: vine.string().minLength(8),
  }),
);

const updateUserValidator = vine.compile(
  vine.object({
    fullName: vine.string().optional(),
    email: vine.string().email().optional(),
    password: vine.string().minLength(8).optional(),
  }),
);

export default class UsersController extends BaseController {
  $configureRoutes(controller: LazyImport<Constructor<UsersController>>) {
    router.get("/", [controller, "findAll"]).as("users.list");
    router.get("/:id", [controller, "findOne"]).as("users.show");
    router.delete("/:id", [controller, "delete"]).as("users.delete");
    router.patch("/:id", [controller, "update"]).as("users.update");
    router.post("/", [controller, "create"]).as("users.create");
  }

  private async requireSuperUserOrSelf(
    auth: HttpContext["auth"],
    userId: number,
  ): Promise<void> {
    if (!auth.isAuthenticated) {
      await auth.authenticate();
    }
    if (!(await this.isSuperUser(auth)) && auth.user?.id !== userId) {
      throw new ForbiddenException();
    }
  }

  async findAll({ request, auth }: HttpContext) {
    await this.requireSuperUser(auth);

    const page = request.input("page", 1);
    const limit = request.input("limit", 10);

    const users = await User.query()
      .select("id", "fullName", "email")
      .paginate(page, limit);

    return { data: users };
  }

  async findOne({ request, auth }: HttpContext) {
    await this.requireSuperUserOrSelf(auth, parseInt(request.param("id")));

    const userId = request.param("id");

    const targetUser = await User.query()
      .select("id", "fullName", "email")
      .where("id", userId)
      .firstOrFail()
      .addErrorContext(() => `User with id ${userId} not found`);

    return { data: targetUser };
  }

  async delete({ request, auth }: HttpContext) {
    await this.requireSuperUserOrSelf(auth, parseInt(request.param("id")));

    const userId = request.param("id");

    const targetUser = await User.findOrFail(userId).addErrorContext(
      () => `User with id ${userId} not found`,
    );

    await targetUser.delete();

    return { success: true };
  }

  async update({ request, auth }: HttpContext) {
    await this.requireSuperUserOrSelf(auth, parseInt(request.param("id")));

    const userId = request.param("id");

    const payload = await request.validateUsing(updateUserValidator);

    const updatedUser = await db.transaction(async (trx) => {
      const targetUser = await User.query({ client: trx })
        .where("id", userId)
        .firstOrFail()
        .addErrorContext(() => `User with id ${userId} not found`);

      targetUser.merge(payload);
      await targetUser.save();

      return targetUser;
    });

    return {
      success: true,
      data: {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
      },
    };
  }

  async create({ request, auth }: HttpContext) {
    await this.requireSuperUser(auth);

    const payload = await request.validateUsing(createUserValidator);

    const newUser = await db.transaction(async (trx) => {
      const user = await User.create(payload, { client: trx });
      return user;
    });

    return {
      success: true,
      data: {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
      },
    };
  }
}
