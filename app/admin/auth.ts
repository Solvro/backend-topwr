import { DefaultAuthProvider, DefaultAuthenticatePayload } from "adminjs";

import logger from "@adonisjs/core/services/logger";

import User from "#models/user";

import componentLoader from "./component_loader.js";

/**
 * Your "authenticate" function. Depending on the auth provider used, the payload may be different.
 *
 * The default authentication provider uses email and password to authenticate. You can modify this
 * function to use email & password to verify if the User exists and if their passwords match.
 *
 * The default implementation below will let any in, so make sure to update it.
 */
const authenticate = async ({
  email,
  password,
}: DefaultAuthenticatePayload) => {
  try {
    const user = await User.verifyCredentials(email, password);
    return {
      email: user.email,
    };
  } catch (error) {
    logger.warn("Invalid admin panel credentials");
    return null;
  }
};

const authProvider = new DefaultAuthProvider({
  componentLoader,
  authenticate,
});

export default authProvider;
