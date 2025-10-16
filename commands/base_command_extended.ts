import { BaseCommand } from "@adonisjs/core/ace";

/**
 * Convenience interface to pass object arrays to listing prompts without the needless mapping overhead
 */
export interface SupportsListing {
  list(): string;
}

export default abstract class BaseCommandExtended extends BaseCommand {
  // Apparently, Adonis tries to serialize everything derived from BaseCommand, even if it is abstract.
  // Thus, the name property is required for it to compile.
  static commandName = "abstract_command";
  static description = "Calling this command does nothing";

  /** Hijack the prompting functions and make them always return the default value or false if none provided
   * It just works
   */
  protected autoUseDefaultPromptValues(this: BaseCommand) {
    this.logger.warning(
      "Will use the default value for all prompts automatically!",
    );
    this.prompt.choice = (_, choices, opts) =>
      // @ts-expect-error -- can't convince TS that this is correct, but it should be
      Promise.resolve(opts?.default ?? choices[0]);
    this.prompt.confirm = (_, opts) =>
      // @ts-expect-error -- okay here adonis devs just screwed up the typing, this ain't my fault
      Promise.resolve(opts?.default ?? false);
  }

  protected async askForListing(
    prompt: string,
    values: string[] | Set<string> | SupportsListing[],
  ) {
    const response = await this.prompt.confirm(prompt, {
      default: false,
    });
    if (response) {
      if (values instanceof Set) {
        if (values.size === 0) {
          this.logger.info("Nothing to list");
          return;
        }
        values.forEach((value) => {
          this.logger.info(value);
        });
      } else {
        if (values.length === 0) {
          this.logger.info("Nothing to list");
          return;
        }
        if (typeof values[0] === "string") {
          (values as string[]).forEach((value) => {
            this.logger.info(value);
          });
        } else {
          (values as SupportsListing[]).forEach((value) => {
            this.logger.info(value.list());
          });
        }
      }
    }
  }
}
