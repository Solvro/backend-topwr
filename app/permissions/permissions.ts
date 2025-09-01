import { Acl } from "@holoyan/adonisjs-permissions";

export const create = await Acl.permission().create({
  slug: "create",
  title: "Create some resource",
});

export const update = await Acl.permission().create({
  slug: "update",
});

export const read = await Acl.permission().create({
  slug: "read",
});

export const destroy = await Acl.permission().create({
  slug: "destroy",
});

export const approve_draft = await Acl.permission().create({
  slug: "approve_draft",
});

export const admin = await Acl.role().create({
  slug: "admin",
});

export const solvro_admin = await Acl.role().create({
  slug: "solvro_admin",
});
