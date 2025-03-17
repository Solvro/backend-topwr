import { Box, DropZone, Label } from "@adminjs/design-system";
import { BasePropertyProps } from "adminjs";
import { File } from "node:buffer";
import React, { FC } from "react";

//Maximum file size allowed in dropbox in MB
const MAX_FILE_SIZE = 1024 * 1024 * 5;
//MIME types that the dropbox will allow to upload
const ALLOWED_FILE_TYPES = ["image/png", "image/jpeg", "image/webp"];

const PhotoDropbox: FC<BasePropertyProps> = (props) => {
  const { property, onChange } = props;
  if (onChange === undefined) {
    throw new Error("Invalid dropbox configuration. onChange is not defined.");
  }
  const handleChange = (files: File[]): void => {
    if (files.length > 0) {
      onChange(property.name, files[0]);
    } else {
      onChange(property.name, null);
    }
  };

  return (
    <Box style={{ marginBottom: "16px" }}>
      <Label>{property.label}</Label>
      <DropZone
        onChange={handleChange}
        multiple={false}
        validate={{ maxSize: MAX_FILE_SIZE, mimeTypes: ALLOWED_FILE_TYPES }}
      />
    </Box>
  );
};

export default PhotoDropbox;
