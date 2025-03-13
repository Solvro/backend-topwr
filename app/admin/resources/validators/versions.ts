import vine from "@vinejs/vine";
import { ValidationMessages } from "@vinejs/vine/types";

export const versionValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1),
    milestoneId: vine.number().min(1).withoutDecimals(),
    releaseDate: vine.date().optional(),
    description: vine.string().trim().optional(),
  }),
);

// ValidationError: Validation failure
//     at SimpleErrorReporter.createError (/Users/kamilfedio/dev/reps/backend-topwr/node_modules/@vinejs/vine/src/reporters/simple_error_reporter.ts:76:12)
//     at eval (eval at #toAsyncFunction (file:///Users/kamilfedio/dev/reps/backend-topwr/node_modules/@vinejs/compiler/build/index.js:1023:12), <anonymous>:207:23)
//     at VineValidator.VineValidator.validate (/Users/kamilfedio/dev/reps/backend-topwr/node_modules/@vinejs/vine/src/vine/validator.ts:157:16)
//     at before (/Users/kamilfedio/dev/reps/backend-topwr/app/admin/resources/versions.ts:101:38)
//     at file:///Users/kamilfedio/dev/reps/backend-topwr/node_modules/adminjs/lib/backend/decorators/action/action-decorator.js:79:99 {
//   status: 422,
//   code: 'E_VALIDATION_ERROR',
//   messages: [
//     {
//       message: 'The milestoneId field must be a number',
//       rule: 'number',
//       field: 'milestoneId'
//     }
//   ]
// }
