import { Box, CheckBox, DropZone } from "@adminjs/design-system";
import { BasePropertyProps } from "adminjs";
import React, { FC, useState } from "react";

import PhotoDisplay from "./photo_display.js";

//Maximum file size allowed in dropbox in MB
const MAX_FILE_SIZE = 1024 * 1024 * 5;
//MIME types that the dropbox will allow to upload
const ALLOWED_FILE_TYPES = ["image/png", "image/jpeg", "image/webp"];

const PhotoDropbox: FC<BasePropertyProps> = (props) => {
  const { property, onChange } = props;
  const [isHidden, setIsHidden] = useState(false);

  // @ts-expect-error DOM is not present in compiler options.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
  const isOnEdit: boolean = window.location.href.endsWith("/edit");

  const propertyName = property.name.substring(1);

  const isRemovableKey = `${propertyName}_isRemovable`;
  if (property.custom[isRemovableKey] === undefined) {
    throw new Error(
      `Invalid dropbox configuration. ${property.name} isRemovable is not defined.`,
    );
  }
  const isRemovable: boolean = property.custom[isRemovableKey] === "true";

  if (onChange === undefined) {
    throw new Error("Invalid dropbox configuration. onChange is not defined.");
  }
  const handleChange = (files: File[]): void => {
    if (files.length > 0) {
      onChange(property.name, files[0]);
    } else {
      onChange(property.name, undefined);
    }
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // @ts-expect-error DOM is not present in compiler options.
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    const isChecked = !event.target.checked;
    setIsHidden(isChecked);
    if (isChecked) {
      onChange(property.name, null);
    }
  };

  return (
    <Box
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        marginTop: "16px",
      }}
    >
      <span style={{ fontSize: "20px" }}>
        Upload new {property.label.substring(1)}
      </span>
      {isOnEdit && (
        <Box>
          <PhotoDisplay {...props} />
          {isRemovable && (
            <div
              style={{
                marginTop: "16px",
                display: "flex",
                gap: "16px",
                alignItems: "center",
              }}
            >
              <span>Check this to remove the current photo.</span>
              <CheckBox
                id={`${property.name}-toggle`}
                label="Remove the current photo"
                checked={isHidden}
                onChange={handleCheckboxChange}
              />
            </div>
          )}
        </Box>
      )}
      {!isHidden && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <span>
            Upload a new photo or, if it exists, replace the current one:
          </span>
          <DropZone
            onChange={handleChange}
            multiple={false}
            validate={{ maxSize: MAX_FILE_SIZE, mimeTypes: ALLOWED_FILE_TYPES }}
          />
        </div>
      )}
    </Box>
  );
};

export default PhotoDropbox;
