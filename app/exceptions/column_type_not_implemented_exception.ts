import NotImplementedException from "./not_implemented_exception.js";

export default class ColumnTypeNotImplementedException extends NotImplementedException {
  constructor(columnName: string) {
    super(
      `Type of '${columnName}' not defined in 'ModelColumnOptions' in 'meta' property. ` +
        `Check '@typedModel' decorator existence and/or column type definition in decorator parameters`,
    );
  }
}
