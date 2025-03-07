import { Box, DropZone, DropZoneItem, Label } from "@adminjs/design-system";
import { BasePropertyProps } from "adminjs";
import { File } from "node:buffer";
import React, { FC } from "react";

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

const MAX_FILE_SIZE = 1024 * 1024 * 5;
const ALLOWED_FILE_TYPES = ["image/png", "image/jpeg", "image/webp"];

/* eslint-disable @typescript-eslint/no-non-null-assertion*/
const PhotoDropbox: FC<BasePropertyProps> = (props) => {
  const [preview, setPreview] = React.useState<string | undefined>(undefined);
  const { property, onChange } = props;

  const handleChange = (files: File[]): void => {
    if (files.length > 0) {
      void fileToBase64(files[0]).then((bs) =>
        setPreview(`data:image/jpeg;base64,${bs}`),
      );
      onChange!(property.name, files[0]);
    } else {
      setPreview(undefined);
      onChange!(property.name, null);
    }
  };

  return (
    <Box>
      <Label>{property.label}</Label>
      <DropZone
        onChange={handleChange}
        multiple={false}
        validate={{ maxSize: MAX_FILE_SIZE, mimeTypes: ALLOWED_FILE_TYPES }}
      />
      {preview !== undefined && (
        <DropZoneItem
          src={preview}
          onRemove={() => onChange!(property.name, null)}
        />
      )}
    </Box>
  );
};

export default PhotoDropbox;
