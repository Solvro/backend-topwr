import { zip } from "@solvro/utils/arrays";
import assert from "node:assert";

export interface ICSObject {
  [K: string]: ICSValue | undefined;
}
export type ICSValue = string | ICSObject | ICSObject[];
export type ICSRoot = ICSObject;

const BEGIN_MARKER = "BEGIN:";
const END_MARKER = "END:";
const SPLIT_LINE_MARKER = " ";

type WarningFunc = (message: string) => void;

function emitParseStack(objectStack: ICSObject[], typeStack: string[]): string {
  return zip(objectStack, typeStack)
    .map(([obj, type]) => {
      if (type in obj && Array.isArray(obj[type])) {
        return `${type}[${obj[type].length}]`;
      }
      return type;
    })
    .join(" -> ");
}

/**
 * Parses a given ICS document.
 *
 * The output is a JSON representation of the document.
 * BEGIN/END are treated as nested object delimeters.
 * Nested objects can either be an object, or an array of objects on the parent object,
 * depending if there are repeats of that object type.
 * Regular properties with : delimeters are treated as strings.
 * Inline objects with ; delimeters are represented as objects.
 *
 * @param ics the ics document
 * @param emitWarning a function to emit warnings (console.warn by default)
 * @returns a parsed ICS object
 */
export function parseICS(
  ics: string,
  emitWarning: WarningFunc = console.warn,
): ICSRoot {
  // state setup
  const output: ICSObject = {};
  const objectStack: ICSObject[] = [];
  const objectTypeStack: string[] = [];
  let currentObject: ICSObject = output;
  let currentKey: string | null = null;
  let unfinishedObject: string | null = null;

  for (const line of ics.trim().replaceAll("\r\n", "\n").split("\n")) {
    // split lines start with a space
    if (line.startsWith(SPLIT_LINE_MARKER)) {
      if (currentKey === null) {
        emitWarning(
          "Encountered split line with no previous key?\n" +
            `Parse stack: ${emitParseStack(objectStack, objectTypeStack)}`,
        );
        continue;
      }

      // skip first char and append
      const value = line.substring(SPLIT_LINE_MARKER.length);
      // to the unfinished object, if exists - else directly
      if (unfinishedObject !== null) {
        unfinishedObject += value;
      } else {
        const currentKeyValue = currentObject[currentKey];
        assert(
          typeof currentKeyValue === "string",
          "currentKey should only point to string values",
        );
        currentObject[currentKey] = currentKeyValue + value;
      }
      continue;
    }
    // finalize the previous field, if exists
    if (currentKey !== null) {
      if (unfinishedObject !== null) {
        const newObj: ICSObject = {};
        for (const prop of unfinishedObject.trim().split(";")) {
          const eqIdx = prop.indexOf("=");
          if (eqIdx === -1) {
            emitWarning(
              `Encountered an inline object property with no = delimiter? ${prop}\n` +
                `Parse stack: ${emitParseStack(objectStack, objectTypeStack)} -> ${currentKey}`,
            );
            continue;
          }
          const key = prop.substring(0, eqIdx);
          const val = prop.substring(eqIdx + 1);
          if (key in newObj) {
            emitWarning(
              `Duplicate property encountered in inline object: ${currentKey}\n` +
                `Parse stack: ${emitParseStack(objectStack, objectTypeStack)} -> ${currentKey}`,
            );
            continue;
          }
          newObj[key] = val;
        }
        currentObject[currentKey] = newObj;
      } else {
        const currentKeyValue = currentObject[currentKey];
        assert(
          typeof currentKeyValue === "string",
          "currentKey should only point to string values",
        );
        currentObject[currentKey] = currentKeyValue.trim();
      }
    }
    unfinishedObject = null;
    currentKey = null;
    // new object start
    if (line.startsWith(BEGIN_MARKER)) {
      const objName = line.substring(BEGIN_MARKER.length).trim();
      if (objName in currentObject) {
        // check existing type - should be an object/array
        if (typeof currentObject[objName] !== "object") {
          throw new Error(
            `Duplicate property encountered: ${objName} was both used as an object type and a string property name!\n` +
              `Parse stack: ${emitParseStack(objectStack, objectTypeStack)}`,
          );
        }

        // if it's not an array, convert it to one
        if (!Array.isArray(currentObject[objName])) {
          currentObject[objName] = [currentObject[objName]];
        }

        // start parsing a new object, appending it to the array
        const arr = currentObject[objName];
        objectStack.push(currentObject);
        objectTypeStack.push(objName);
        currentObject = {};
        arr.push(currentObject);
      } else {
        // start parsing a new object
        currentObject[objName] = {};
        objectStack.push(currentObject);
        objectTypeStack.push(objName);
        currentObject = currentObject[objName];
      }
    }
    // object end
    else if (line.startsWith(END_MARKER)) {
      const objName = line.substring(END_MARKER.length).trim();
      const expectedObjName = objectTypeStack.pop();
      if (expectedObjName === undefined) {
        throw new Error(
          `Unexpected END: for object type ${objName} at the root object`,
        );
      }
      if (expectedObjName !== objName) {
        objectTypeStack.push(expectedObjName);
        throw new Error(
          `Unexpected END: for object type ${objName} - expected ${expectedObjName}\n` +
            `Parse stack: ${emitParseStack(objectStack, objectTypeStack)}`,
        );
      }

      // drop a level
      const prevOject = objectStack.pop();
      assert(prevOject !== undefined);
      currentObject = prevOject;
    }
    // regular field?
    else {
      const splitIdx = line.indexOf(":");
      const objSplitIdx = line.indexOf(";");
      if (objSplitIdx !== -1 && (splitIdx === -1 || splitIdx > objSplitIdx)) {
        // we got an inline object
        currentKey = line.substring(0, objSplitIdx);
        unfinishedObject = line.substring(objSplitIdx + 1);
        // check if it exists
        if (currentKey in currentObject) {
          emitWarning(
            `Duplicate property encountered: ${currentKey}\n` +
              `Parse stack: ${emitParseStack(objectStack, objectTypeStack)}`,
          );
          // cancel
          currentKey = null;
          unfinishedObject = null;
        }
        continue;
      }
      if (splitIdx === -1) {
        emitWarning(
          `Encountered a property line with no : delimiter? ${line}\n` +
            `Parse stack: ${emitParseStack(objectStack, objectTypeStack)}`,
        );
        continue;
      }

      // extract key & value
      currentKey = line.substring(0, splitIdx);
      const value = line.substring(splitIdx + 1);

      // check if it exists
      if (currentKey in currentObject) {
        emitWarning(
          `Duplicate property encountered: ${currentKey}\n` +
            `Parse stack: ${emitParseStack(objectStack, objectTypeStack)}`,
        );
        currentKey = null;
        continue;
      }

      // add property
      currentObject[currentKey] = value;
    }
  }

  if (objectStack.length !== 0) {
    throw new Error(
      `Unexpected EOF: we're still ${objectStack.length} levels deep\n` +
        `Parse stack: ${emitParseStack(objectStack, objectTypeStack)}`,
    );
  }

  return output;
}
