import vine, { errors } from "@vinejs/vine";
import { ActionRequest, ValidationError } from "adminjs";

interface VineError {
  message: string;
  rule: string;
  field: string;
}

export async function validateResource(
  validator: ReturnType<typeof vine.compile>,
  request: ActionRequest,
): Promise<ActionRequest> {
  const { method, payload } = request;
  if (method === "post" && payload !== undefined) {
    try {
      request.payload = (await validator.validate(payload)) as Record<
        string,
        unknown
      >;
    } catch (err) {
      if (err instanceof errors.E_VALIDATION_ERROR) {
        const errorMessages = err.messages as VineError[];
        const errorsMap = errorMessages.reduce(
          (acc, { message, field, rule }) => ({
            ...acc,
            [field]: { message, type: rule },
          }),
          {},
        );
        throw new ValidationError(errorsMap, {
          message: "Oops you have validation errors",
        });
      }
      throw err;
    }
  }
  return request;
}
