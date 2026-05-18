import vine from "@vinejs/vine";

import type { HttpContext } from "@adonisjs/core/http";
import router from "@adonisjs/core/services/router";
import type { Constructor, LazyImport } from "@adonisjs/core/types/http";
import db from "@adonisjs/lucid/services/db";

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

const paginationValidator = vine.compile(
  vine.object({
    page: vine.number().min(1).optional(),
    limit: vine.number().min(1).max(100).optional(),
  }),
);

const userIdParamValidator = vine.compile(
  vine.object({
    id: vine.number(),
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

  async findAll({ request, auth }: HttpContext) {
    await this.requireSuperUser(auth);

    const { page = 1, limit = 10 } =
      await request.validateUsing(paginationValidator);

    const users = await User.query()
      .select("id", "fullName", "email")
      .paginate(page, limit);

    return { data: users };
  }

  async findOne({ request, auth }: HttpContext) {
    const user = await request.validateUsing(userIdParamValidator);

    await this.requireSuperUser(auth);

    const targetUser = await User.query()
      .select("id", "fullName", "email")
      .where("id", user.id)
      .firstOrFail()
      .addErrorContext(() => `User with id ${user.id} not found`);

    return { data: targetUser };
  }

  async delete({ request, auth }: HttpContext) {
    const user = await request.validateUsing(userIdParamValidator);

    await this.requireSuperUser(auth);

    const targetUser = await User.findOrFail(user.id).addErrorContext(
      () => `User with id ${user.id} not found`,
    );

    await targetUser.delete();

    return { success: true };
  }

  async update({ request, auth }: HttpContext) {
    const user = await request.validateUsing(userIdParamValidator);

    await this.requireSuperUser(auth);

    const payload = await request.validateUsing(updateUserValidator);

    const updatedUser = await db.transaction(async (trx) => {
      const targetUser = await User.query({ client: trx })
        .where("id", user.id)
        .firstOrFail()
        .addErrorContext(() => `User with id ${user.id} not found`);

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
