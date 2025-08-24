import { Acl } from "@holoyan/adonisjs-permissions";

const create = await Acl.permission().create({
  slug: "create",
  title: "Create some resource",
});

const update = await Acl.permission().create({
  slug: "update",
});

const read = await Acl.permission().create({
  slug: "read",
});

const destroy = await Acl.permission().create({
  slug: "destroy",
});

const approve_draft = await Acl.permission().create({
  slug: "approve_draft",
});

const admin = await Acl.role().create({
  slug: "admin",
});

const solvro_admin = await Acl.role().create({
  slug: "solvro_admin",
});
