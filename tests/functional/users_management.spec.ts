import jwt from "jsonwebtoken";
import crypto from "node:crypto";

import { test } from "@japa/runner";

import testUtils from "@adonisjs/core/services/test_utils";
import db from "@adonisjs/lucid/services/db";

import User from "#models/user";
import env from "#start/env";

function uniqueEmail(prefix: string) {
  const id = crypto.randomUUID().slice(0, 8);
  return `${prefix}-${id}@user.test`;
}

async function makeToken(user: User): Promise<string> {
  const ACCESS_SECRET = env.get("ACCESS_SECRET");
  const AUDIENCE = "admin.topwr.solvro.pl";
  const ISSUER = "admin.topwr.solvro.pl";
  const ACCESS_EXPIRES_IN_MS = Number.parseInt(
    env.get("ACCESS_EXPIRES_IN_MS", "3600000"),
  );

  return jwt.sign(
    {
      isRefresh: false,
    },
    ACCESS_SECRET,
    {
      subject: user.id.toString(),
      audience: AUDIENCE,
      issuer: ISSUER,
      expiresIn: ACCESS_EXPIRES_IN_MS,
      algorithm: "HS256",
      allowInsecureKeySizes: false,
      allowInvalidAsymmetricKeyTypes: false,
    },
  );
}

async function ensureSolvroAdminRoleId(): Promise<number> {
  // Ensure 'solvro_admin' exists in access_roles and return its id
  const existing: unknown = await db
    .knexQuery()
    .table("access_roles")
    .where({ slug: "solvro_admin" })
    .first();
  if (existing !== null && existing !== undefined) {
    return Number((existing as { id: number | string }).id);
  }

  const idNum = await db
    .knexQuery()
    .table("access_roles")
    .insert({
      slug: "solvro_admin",
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning("id")
    .then((result: unknown) => {
      if (Array.isArray(result)) {
        const first = result[0] as unknown;
        if (typeof first === "object" && first !== null && "id" in first) {
          return Number((first as { id: number | string }).id);
        }
        return Number(first);
      }
      if (typeof result === "object" && result !== null && "id" in result) {
        return Number((result as { id: number | string }).id);
      }
      return Number(result);
    });

  return idNum;
}

async function assignSolvroAdmin(user: User) {
  const roleId = await ensureSolvroAdminRoleId();
  // model_roles: model_type, model_id, role_id
  const existing: unknown = await db
    .knexQuery()
    .table("model_roles")
    .where({ model_type: "users", model_id: user.id, role_id: roleId })
    .first();
  if (existing === null || existing === undefined) {
    await db.knexQuery().table("model_roles").insert({
      model_type: "users",
      model_id: user.id,
      role_id: roleId,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }
}

test.group("User Management API", (group) => {
  group.setup(async () => {
    await testUtils.db().migrate();
  });
  group.teardown(async () => {
    await testUtils.db().truncate();
  });

  test("get /api/v1/users returns list of users for admin", async ({
    client,
    assert,
  }) => {
    const adminUser = await User.create({
      email: uniqueEmail("admin"),
      password: "SecurePassword123!",
      fullName: "Admin 1",
    });
    await assignSolvroAdmin(adminUser);
    const token = await makeToken(adminUser);

    const response = await client.get("/api/v1/users").bearerToken(token);

    response.assertStatus(200);
    const body = response.body() as {
      data: { meta: unknown; data: unknown[] };
    };
    const users = body.data;

    assert.property(users, "meta");
    assert.property(users, "data");
    assert.isArray(users.data);
  });

  test("get /api/v1/users requires authentication: guest gets 401", async ({
    client,
  }) => {
    const response = await client.get("/api/v1/users");

    response.assertStatus(401);
  });

  test("get /api/v1/users requires superuser: regular user gets 403 ", async ({
    client,
  }) => {
    const regularUser = await User.create({
      email: uniqueEmail("student"),
      password: "SecurePassword123!",
      fullName: "Regular Student 1",
    });
    const token = await makeToken(regularUser);

    const response = await client.get("/api/v1/users").bearerToken(token);

    response.assertStatus(403);
  });

  test("get /api/v1/users/:id returns details of a specific user", async ({
    client,
    assert,
  }) => {
    const admin = await User.create({
      email: uniqueEmail("admin"),
      password: "SecurePassword123!",
      fullName: "Admin 2",
    });
    await assignSolvroAdmin(admin);
    const token = await makeToken(admin);

    const targetUser = await User.create({
      email: uniqueEmail("target"),
      password: "SecurePassword456!",
      fullName: "Target User",
    });

    const response = await client
      .get(`/api/v1/users/${targetUser.id}`)
      .bearerToken(token);

    response.assertStatus(200);
    const body = response.body() as unknown as {
      data: { email: string; fullName: string };
    };
    assert.equal(body.data.email, targetUser.email);
    assert.equal(body.data.fullName, targetUser.fullName);
  });

  test("get /api/v1/users/:id requires superuser: regular user gets 403", async ({
    client,
  }) => {
    const student = await User.create({
      email: uniqueEmail("student"),
      password: "SecurePassword123!",
      fullName: "Regular User 2",
    });
    const token = await makeToken(student);
    const targetUser = await User.create({
      email: uniqueEmail("target_user"),
      password: "SecurePassword!987",
      fullName: "Target User",
    });

    const response = await client
      .get(`/api/v1/users/${targetUser.id}`)
      .bearerToken(token);

    response.assertStatus(403);
  });

  test("get /api/v1/users/:id requires authentication: guest gets 401", async ({
    client,
  }) => {
    const targetUser = await User.create({
      email: uniqueEmail("target_user"),
      password: "SecurePassword123!",
      fullName: "Target User",
    });

    const response = await client.get(`/api/v1/users/${targetUser.id}`);

    response.assertStatus(401);
  });

  test("get /api/v1/users/:id returns 404 when user does not exist", async ({
    client,
  }) => {
    const admin = await User.create({
      email: uniqueEmail("admin"),
      password: "SecurePassword123!",
      fullName: "Admin 3",
    });
    await assignSolvroAdmin(admin);
    const token = await makeToken(admin);
    const fakeId = 999999;

    const response = await client
      .get(`/api/v1/users/${fakeId}`)
      .bearerToken(token);

    response.assertStatus(404);
  });

  test("get /api/v1/users/:id prevents data leak: guest gets 401 for nonexistent user", async ({
    client,
  }) => {
    const fakeId = 999999;
    const response = await client.get(`/api/v1/users/${fakeId}`);

    response.assertStatus(401);
  });

  test("get /api/v1/users/:id prevents data leak: regular user gets 403 for nonexistent user", async ({
    client,
  }) => {
    const regularUser = await User.create({
      email: uniqueEmail("student"),
      password: "SecurePassword123!",
      fullName: "Regular User",
    });
    const token = await makeToken(regularUser);
    const fakeId = 999999;

    const response = await client
      .get(`/api/v1/users/${fakeId}`)
      .bearerToken(token);

    response.assertStatus(403);
  });

  test("post /api/v1/users creates a new user when admin sends valid data", async ({
    client,
    assert,
  }) => {
    const adminUser = await User.create({
      email: uniqueEmail("admin"),
      password: "SecurePassword123!",
      fullName: "Admin 4",
    });
    await assignSolvroAdmin(adminUser);
    const token = await makeToken(adminUser);

    const newUserEmail = uniqueEmail("new.user");
    const newUserData = {
      email: newUserEmail,
      password: "SecurePassword!987",
      fullName: "New User",
    };

    const response = await client
      .post("/api/v1/users")
      .bearerToken(token)
      .json(newUserData);

    response.assertStatus(200);
    const cBody = response.body() as unknown as {
      data?: {
        id?: number;
        email?: string;
      };
    };
    assert.equal(cBody.data?.email, newUserEmail);
    assert.exists(cBody.data?.id);
  });

  test("post /api/v1/users validates data: rejects too short password with 422", async ({
    client,
    assert,
  }) => {
    const admin = await User.create({
      email: uniqueEmail("admin"),
      password: "SecurePassword123!",
      fullName: "Admin 5",
    });

    await assignSolvroAdmin(admin);
    const token = await makeToken(admin);

    const newUserBadData = {
      email: uniqueEmail("bad_pass"),
      password: "123",
      fullName: "New User",
    };

    const response = await client
      .post("/api/v1/users")
      .bearerToken(token)
      .json(newUserBadData);

    response.assertStatus(422);
    assert.property(response.body(), "error");
  });

  test("post /api/v1/users validates data: rejects already taken email with 409", async ({
    client,
    assert,
  }) => {
    const admin = await User.create({
      email: uniqueEmail("admin"),
      password: "SecurePassword123!",
      fullName: "Admin 6",
    });
    await assignSolvroAdmin(admin);
    const token = await makeToken(admin);

    const takenEmail = uniqueEmail("taken");
    await User.create({
      email: takenEmail,
      password: "SecurePassword!987",
      fullName: "Old User",
    });

    const duplicateEmailUser = {
      email: takenEmail,
      password: "SecurePassword456!",
      fullName: "New User",
    };

    const response = await client
      .post("/api/v1/users")
      .bearerToken(token)
      .json(duplicateEmailUser);

    response.assertStatus(409);
    assert.property(response.body(), "error");
  });

  test("post /api/v1/users requires superuser: regular user gets 403", async ({
    client,
  }) => {
    const regularUser = await User.create({
      email: uniqueEmail("student"),
      password: "SecurePassword123!",
      fullName: "Regular User",
    });
    const token = await makeToken(regularUser);

    const newUser = {
      email: uniqueEmail("new_user"),
      password: "SecurePassword456!",
      fullName: "New User",
    };

    const response = await client
      .post("/api/v1/users")
      .bearerToken(token)
      .json(newUser);

    response.assertStatus(403);
  });

  test("post /api/v1/users requires authentication: guest gets 401", async ({
    client,
  }) => {
    const guest = {
      email: uniqueEmail("guest"),
      password: "SecurePassword123!",
      fullName: "Guest",
    };

    const response = await client.post("/api/v1/users").json(guest);

    response.assertStatus(401);
  });

  test("delete /api/v1/users/:id deletes user when requested by admin", async ({
    client,
  }) => {
    const admin = await User.create({
      email: uniqueEmail("admin"),
      password: "SecurePassword123!",
      fullName: "Admin 7",
    });
    await assignSolvroAdmin(admin);
    const token = await makeToken(admin);

    const userToDelete = await User.create({
      email: uniqueEmail("to_delete"),
      password: "SecurePassword456!",
      fullName: "Deleted User",
    });

    const userToDeleteId = userToDelete.id;

    const response = await client
      .delete(`/api/v1/users/${userToDeleteId}`)
      .bearerToken(token);

    response.assertStatus(200);
  });

  test("delete /api/v1/users/:id requires superuser: regular user gets 403", async ({
    client,
  }) => {
    const regularUser = await User.create({
      email: uniqueEmail("student"),
      password: "SecurePassword123!",
      fullName: "Regular User",
    });
    const token = await makeToken(regularUser);

    const targetUser = await User.create({
      email: uniqueEmail("targe_user"),
      password: "SecurePassword456!",
      fullName: "Target User",
    });

    const response = await client
      .delete(`/api/v1/users/${targetUser.id}`)
      .bearerToken(token);

    response.assertStatus(403);
  });

  test("delete /api/v1/users/:id requires authentication: guest gets 401", async ({
    client,
  }) => {
    const targetUser = await User.create({
      email: uniqueEmail("target_user"),
      password: "SecurePassword123!",
      fullName: "Target User 2",
    });

    const response = await client.delete(`/api/v1/users/${targetUser.id}`);

    response.assertStatus(401);
  });

  test("delete /api/v1/users/:id returns 404 when user does not exist", async ({
    client,
  }) => {
    const admin = await User.create({
      email: uniqueEmail("admin"),
      password: "SecurePassword123!",
      fullName: "Admin 8",
    });
    await assignSolvroAdmin(admin);
    const token = await makeToken(admin);

    const fakeUserId = 999999;

    const response = await client
      .delete(`/api/v1/users/${fakeUserId}`)
      .bearerToken(token);

    response.assertStatus(404);
  });

  test("delete /api/v1/users/:id prevents data leak: guest gets 401 for nonexistent user", async ({
    client,
  }) => {
    const fakeId = 999999;
    const response = await client.delete(`/api/v1/users/${fakeId}`);

    response.assertStatus(401);
  });

  test("delete /api/v1/users/:id prevents data leak: regular user gets 403 for nonexistent user", async ({
    client,
  }) => {
    const regularUser = await User.create({
      email: uniqueEmail("student"),
      password: "SecurePassword123!",
      fullName: "Regular User",
    });
    const token = await makeToken(regularUser);
    const fakeId = 999999;

    const response = await client
      .delete(`/api/v1/users/${fakeId}`)
      .bearerToken(token);

    response.assertStatus(403);
  });

  test("patch /api/v1/users/:id updates user data successfully", async ({
    client,
    assert,
  }) => {
    const admin = await User.create({
      email: uniqueEmail("admin"),
      password: "SecurePassword123!",
      fullName: "Admin 9",
    });
    await assignSolvroAdmin(admin);
    const token = await makeToken(admin);

    const originalEmail = uniqueEmail("to_change");
    const targetUser = await User.create({
      email: originalEmail,
      password: "OldPassword123!",
      fullName: "Old Name",
    });

    const newData = {
      id: targetUser.id,
      fullName: "New Name",
    };

    const response = await client
      .patch(`/api/v1/users/${targetUser.id}`)
      .bearerToken(token)
      .json(newData);

    response.assertStatus(200);

    const cBody = response.body() as unknown as {
      data?: {
        id?: number;
        email?: string;
        fullName?: string;
      };
    };

    assert.equal(cBody.data?.fullName, "New Name");
    assert.equal(cBody.data?.email, originalEmail);
  });

  test("patch /api/v1/users/:id requires superuser: regular user gets 403", async ({
    client,
  }) => {
    const regularUser = await User.create({
      email: uniqueEmail("regular_user"),
      password: "SecurePassword123!",
      fullName: "Regular User",
    });
    const token = await makeToken(regularUser);

    const targetUser = await User.create({
      email: uniqueEmail("target_user"),
      password: "SomePassword123!",
      fullName: "Target User",
    });

    const response = await client
      .patch(`/api/v1/users/${targetUser.id}`)
      .bearerToken(token)
      .json({
        fullName: "Hacked Name",
      });

    response.assertStatus(403);
  });

  test("patch /api/v1/users/:id requires authentication: guest gets 401", async ({
    client,
  }) => {
    const targetUser = await User.create({
      email: uniqueEmail("target_user"),
      password: "SomePassword123!",
      fullName: "Target User",
    });

    const response = await client.patch(`/api/v1/users/${targetUser.id}`).json({
      fullName: "Hacked Name",
    });

    response.assertStatus(401);
  });

  test("patch /api/v1/users/:id returns 404 when user does not exist", async ({
    client,
  }) => {
    const admin = await User.create({
      email: uniqueEmail("admin"),
      password: "SecurePassword123!",
      fullName: "Admin 9",
    });
    await assignSolvroAdmin(admin);
    const token = await makeToken(admin);

    const fakeUserId = 999999;

    const response = await client
      .patch(`/api/v1/users/${fakeUserId}`)
      .bearerToken(token)
      .json({
        fullName: "Guest Name",
      });

    response.assertStatus(404);
  });

  test("patch /api/v1/users/:id prevents data leak: guest gets 401 for nonexistent user", async ({
    client,
  }) => {
    const fakeId = 999999;
    const response = await client.patch(`/api/v1/users/${fakeId}`).json({
      fullName: "Guest Name",
    });

    response.assertStatus(401);
  });

  test("patch /api/v1/users/:id prevents data leak: regular user gets 403 for nonexistent user", async ({
    client,
  }) => {
    const regularUser = await User.create({
      email: uniqueEmail("student"),
      password: "SecurePassword123!",
      fullName: "Regular User",
    });
    const token = await makeToken(regularUser);
    const fakeId = 999999;

    const response = await client
      .patch(`/api/v1/users/${fakeId}`)
      .bearerToken(token)
      .json({
        fullName: "Unauthorized Name",
      });

    response.assertStatus(403);
  });

  test("patch /api/v1/users/:id validates data: rejects already taken email with 409", async ({
    client,
    assert,
  }) => {
    const admin = await User.create({
      email: uniqueEmail("admin"),
      password: "SecurePassword123!",
      fullName: "Admin 10",
    });
    await assignSolvroAdmin(admin);
    const token = await makeToken(admin);

    const targetUser = await User.create({
      email: uniqueEmail("target_user"),
      password: "SecurePassword456!",
      fullName: "Target User",
    });

    const takenEmail = uniqueEmail("taken");
    await User.create({
      email: takenEmail,
      password: "SecurePassword!987",
      fullName: "Taken Email",
    });

    const response = await client
      .patch(`/api/v1/users/${targetUser.id}`)
      .bearerToken(token)
      .json({
        email: takenEmail,
      });

    response.assertStatus(409);
    assert.property(response.body(), "error");
  });

  test("patch /api/v1/users/:id validates data: rejects too short password with 422", async ({
    client,
    assert,
  }) => {
    const admin = await User.create({
      email: uniqueEmail("admin"),
      password: "SecurePassword123!",
      fullName: "Admin 11",
    });
    await assignSolvroAdmin(admin);
    const token = await makeToken(admin);

    const targetUser = await User.create({
      email: uniqueEmail("target_user"),
      password: "SecurePassword456!",
      fullName: "Target User",
    });

    const response = await client
      .patch(`/api/v1/users/${targetUser.id}`)
      .bearerToken(token)
      .json({
        password: "123",
      });

    response.assertStatus(422);
    assert.property(response.body(), "error");
  });
});
