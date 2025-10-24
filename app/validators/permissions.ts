import vine from "@vinejs/vine";

const resourceSchema = vine.object({
  type: vine.enum(["class", "model"]),
  name: vine.string(),
  id: vine.number().optional(),
});

const actionSchema = vine.enum(["read", "create", "update", "destroy"]);

export const allowPermissionValidator = vine.compile(
  vine.object({
    userId: vine.number(),
    action: actionSchema,
    resource: resourceSchema,
  }),
);

export const revokePermissionValidator = vine.compile(
  vine.object({
    userId: vine.number(),
    action: actionSchema,
    resource: resourceSchema,
  }),
);
