import vine, { BaseLiteralType, Vine } from "@vinejs/vine";
import { FieldContext, FieldOptions, Validation } from "@vinejs/vine/types";
import { DateTime } from "luxon";
import type { DateTimeOptions } from "luxon";
import assert from "node:assert";

const luxonDateTimeRule = vine.createRule(
  (value: unknown, opts: DateTimeOptions, field: FieldContext) => {
    if (value instanceof DateTime) {
      if (!value.isValid) {
        field.report(
          `Invalid luxon DateTime in {{ field }}: ${value.invalidReason} - ${value.invalidExplanation}`,
          "luxonDateTime",
          field,
        );
      }
    } else if (typeof value === "string") {
      const dt = DateTime.fromISO(value, opts);

      if (dt.isValid) {
        field.mutate(dt, field);
      } else {
        field.report(
          `Failed to parse {{ field }} as a luxon DateTime: ${dt.invalidReason} - ${dt.invalidExplanation}`,
          "luxonDateTime",
          field,
        );
      }
    } else if (value instanceof Date) {
      const dt = DateTime.fromJSDate(value, opts);

      if (dt.isValid) {
        field.mutate(dt, field);
      } else {
        field.report(
          `Failed to parse {{ field }} as a luxon DateTime: ${dt.invalidReason} - ${dt.invalidExplanation}`,
          "luxonDateTime",
          field,
        );
      }
    } else {
      field.report(
        "Failed to parse {{ field }} as a luxon DateTime: must be a string or JS Date",
        "luxonDateTime",
        field,
      );
    }
  },
);

type DateCompareFn = (val: DateTime<true>, ref: DateTime<true>) => boolean;
type ReferenceDate = DateTime<true> | ((field: FieldContext) => DateTime<true>);
interface CompareRuleOpts {
  ref: DateTime<true> | ((field: FieldContext) => DateTime<true> | null);
  compare: DateCompareFn;
  compareName: string;
}
const compareRule = vine.createRule(
  (
    value: unknown,
    { ref, compare, compareName }: CompareRuleOpts,
    field: FieldContext,
  ) => {
    if (!field.isValid) {
      return;
    }
    assert(value instanceof DateTime);
    assert(value.isValid);
    if (typeof ref === "function") {
      // thanks TS for making this extremely obnoxious
      const tmpRef = ref(field);
      if (tmpRef === null) {
        return;
      }
      ref = tmpRef;
    }
    assert(ref.isValid, "Invalid reference datetime");
    if (compare(value as DateTime<true>, ref)) {
      return;
    }
    field.report(
      `{{ field }} was expected to be ${compareName}`,
      "luxonDateTime.compare",
      field,
      {
        date: ref.toISO(),
      },
    );
  },
);

interface OtherFieldOpts {
  allowUndefined?: boolean;
  allowNull?: boolean;
}
function otherFieldRef(
  otherField: string,
  opts: OtherFieldOpts,
): (field: FieldContext) => DateTime<true> | null {
  return (field) => {
    const otherFieldValue = vine.helpers.getNestedValue(
      otherField,
      field,
    ) as unknown;
    if (otherFieldValue === undefined && opts.allowUndefined === true) {
      return null;
    } else if (otherFieldValue === null && opts.allowNull === true) {
      return null;
    } else if (otherFieldValue instanceof DateTime && otherFieldValue.isValid) {
      return otherFieldValue;
    } else if (otherFieldValue instanceof Date) {
      const dt = DateTime.fromJSDate(otherFieldValue);
      if (dt.isValid) {
        return dt;
      }
    } else if (typeof otherFieldValue === "string") {
      const dt = DateTime.fromISO(otherFieldValue);
      if (dt.isValid) {
        return dt;
      }
    }
    field.report(
      `Cannot compare {{field}} with ${otherField}: ${otherField} isn't a valid DateTime`,
      "luxonDateTime.compareField",
      field,
    );
    return null;
  };
}

export class VineLuxonDateTime extends BaseLiteralType<
  string | Date,
  DateTime<true>,
  DateTime<true>
> {
  constructor(
    options?: Partial<FieldOptions> & { dateOpts?: DateTimeOptions },
    validations?: Validation<unknown>[],
  ) {
    super(options, validations ?? [luxonDateTimeRule(options?.dateOpts ?? {})]);
  }

  equals(ref: ReferenceDate): this {
    return this.use(
      compareRule({
        ref,
        compareName: "equal to {{date}}",
        compare: (val, r) => val.equals(r),
      }),
    );
  }

  after(ref: ReferenceDate): this {
    return this.use(
      compareRule({
        ref,
        compareName: "after {{date}}",
        compare: (val, r) => val.diff(r).milliseconds > 0,
      }),
    );
  }

  afterOrEqual(ref: ReferenceDate): this {
    return this.use(
      compareRule({
        ref,
        compareName: "after or equal to {{date}}",
        compare: (val, r) => val.diff(r).milliseconds >= 0,
      }),
    );
  }

  before(ref: ReferenceDate): this {
    return this.use(
      compareRule({
        ref,
        compareName: "before {{date}}",
        compare: (val, r) => val.diff(r).milliseconds < 0,
      }),
    );
  }

  beforeOrEqual(ref: ReferenceDate): this {
    return this.use(
      compareRule({
        ref,
        compareName: "before or equal to {{date}}",
        compare: (val, r) => val.diff(r).milliseconds <= 0,
      }),
    );
  }

  equalsField(otherField: string, opts?: OtherFieldOpts): this {
    return this.use(
      compareRule({
        ref: otherFieldRef(otherField, opts ?? {}),
        compareName: `equal to field ${otherField}`,
        compare: (val, r) => val.equals(r),
      }),
    );
  }

  afterField(otherField: string, opts?: OtherFieldOpts): this {
    return this.use(
      compareRule({
        ref: otherFieldRef(otherField, opts ?? {}),
        compareName: `after field ${otherField}`,
        compare: (val, r) => val.diff(r).milliseconds > 0,
      }),
    );
  }

  afterOrEqualField(otherField: string, opts?: OtherFieldOpts): this {
    return this.use(
      compareRule({
        ref: otherFieldRef(otherField, opts ?? {}),
        compareName: `after or equal to field ${otherField}`,
        compare: (val, r) => val.diff(r).milliseconds >= 0,
      }),
    );
  }

  beforeField(otherField: string, opts?: OtherFieldOpts): this {
    return this.use(
      compareRule({
        ref: otherFieldRef(otherField, opts ?? {}),
        compareName: `before field ${otherField}`,
        compare: (val, r) => val.diff(r).milliseconds < 0,
      }),
    );
  }

  beforeOrEqualField(otherField: string, opts?: OtherFieldOpts): this {
    return this.use(
      compareRule({
        ref: otherFieldRef(otherField, opts ?? {}),
        compareName: `before or equal to field ${otherField}`,
        compare: (val, r) => val.diff(r).milliseconds <= 0,
      }),
    );
  }

  clone(): this {
    return new VineLuxonDateTime(
      this.cloneOptions(),
      this.cloneValidations(),
    ) as this;
  }
}

Vine.macro("luxonDateTime", function (dateOpts?: DateTimeOptions) {
  return new VineLuxonDateTime({
    dateOpts,
  });
});

declare module "@vinejs/vine" {
  interface Vine {
    luxonDateTime(dateOpts?: DateTimeOptions): VineLuxonDateTime;
  }
}
