import { test } from "@japa/runner";

import testUtils from "@adonisjs/core/services/test_utils";

import User from "#models/user";

import {
  createAdminWithToken,
  createUserWithToken,
  uniqueEmail,
} from "./auth_helpers.js";

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
    const { token } = await createAdminWithToken("admin1", "Solvro Admin");

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
    const { token } = await createUserWithToken("user1", "Regular User 1");

    const response = await client.get("/api/v1/users").bearerToken(token);

    response.assertStatus(403);
  });

  test("get /api/v1/users/:id returns details of a specific user", async ({
    client,
    assert,
  }) => {
    const { token } = await createAdminWithToken("admin2", "Solvro Admin 2");

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
    const { token } = await createUserWithToken("user2", "Regular User 2");

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
    const { token } = await createAdminWithToken("admin3", "Solvro Admin 3");
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
    const { token } = await createUserWithToken("user3", "Regular User 3");
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
    const { token } = await createAdminWithToken("admin4", "Solvro Admin 4");

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
    const { token } = await createAdminWithToken("admin5", "Solvro Admin 5");

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
    const { token } = await createAdminWithToken("admin6", "Solvro Admin 6");

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
    const { token } = await createUserWithToken("user4", "Regular User 4");

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
    const { token } = await createAdminWithToken("admin7", "Solvro Admin 7");

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
    const { token } = await createUserWithToken("user5", "Regular User 5");

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
    const { token } = await createAdminWithToken("admin8", "Solvro Admin 8");

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
    const { token } = await createUserWithToken("user6", "Regular User 6");
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
    const { token } = await createAdminWithToken("admin9", "Solvro Admin 9");

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
    const { token } = await createUserWithToken("user7", "Regular User 7");

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
    const { token } = await createAdminWithToken("admin10", "Solvro Admin 10");

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
    const { token } = await createUserWithToken("user8", "Regular User 8");
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
    const { token } = await createAdminWithToken("admin11", "Solvro Admin 11");

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
    const { token } = await createAdminWithToken("admin12", "Solvro Admin 12");

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
