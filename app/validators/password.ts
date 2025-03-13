import vine from "@vinejs/vine";

const lowerCaseLetterRule = vine.createRule((value, _, field) => {
  if (vine.helpers.isString(value)) {
    return;
  }
  if (/.*[a-z].*/.test(value as string) === false) {
    field.report(
      "The {{field}} field does not contain any lower case letter",
      "lowerCaseLetterRule",
      field,
    );
  }
});

const upperCaseLetterRule = vine.createRule((value, _, field) => {
  if (vine.helpers.isString(value)) {
    return;
  }
  if (/.*[A-Z].*/.test(value as string) === false) {
    field.report(
      "The {{field}} field does not contain any upper case letter",
      "upperCaseLetterRule",
      field,
    );
  }
});

const digitRule = vine.createRule((value, _, field) => {
  if (vine.helpers.isString(value)) {
    return;
  }
  if (/.*[0-9].*/.test(value as string) === false) {
    field.report(
      "The {{field}} field does not contain any digit",
      "digitRule",
      field,
    );
  }
});

export const passwordValidator = vine.compile(
  vine.object({
    password: vine
      .string()
      .minLength(8)
      .use(lowerCaseLetterRule())
      .use(upperCaseLetterRule())
      .use(digitRule())
      .bail(false),
  }),
);
