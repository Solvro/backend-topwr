import { Button, DropZone, FormGroup, Label } from "@adminjs/design-system";
import {
  BasePropertyJSON,
  BasePropertyProps,
  PropertyDescription,
  PropertyJSON,
  useTranslation,
} from "adminjs";
import React, { FC, MouseEvent, useEffect, useState } from "react";

import PhotoDisplay from "./photo_display.js";

//Maximum file size allowed in dropbox in MB
const MAX_FILE_SIZE = 1024 * 1024 * 5;
//MIME types that the dropbox will allow to upload
const ALLOWED_FILE_TYPES = ["image/png", "image/jpeg", "image/webp"];

type State = "unmodified" | "delete" | "upload";

const PhotoDropbox: FC<BasePropertyProps> = (props) => {
  const { property, onChange, resource, record } = props;
  const [currentState, setState] = useState<State>("unmodified");
  const [uploadZoneVisible, setUploadZoneVisible] = useState(false);
  const [uploadPreviewURL, setUploadPreviewURL] = useState<string | undefined>(
    undefined,
  );
  const { translateComponent, translateButton } = useTranslation();

  useEffect(
    () => () =>
      void (
        uploadPreviewURL !== undefined && URL.revokeObjectURL(uploadPreviewURL)
      ),
    [uploadPreviewURL],
  );

  if (onChange === undefined) {
    throw new Error("Invalid dropbox configuration. onChange is not defined.");
  }

  const propertyName = property.name.substring(1);
  const originalProperty = resource.properties[propertyName] as
    | BasePropertyJSON
    | undefined;

  if (originalProperty === undefined) {
    throw new Error(
      `Invalid dropbox configuration. Original property '${propertyName}' for dropbox '${property.name}' is not defined.`,
    );
  }

  const resourceId = originalProperty.resourceId;

  // exclusively for the PropertyDescription component
  // according to the docs, path and propertyPath should be equal for non-array properties
  const originalExtendedProperty = {
    path: originalProperty.propertyPath,
    ...originalProperty,
  } as PropertyJSON;

  const isNewRecord: boolean =
    props.where === "edit" && record?.params[propertyName] === undefined;
  const photoExists = (record?.params[propertyName] ?? null) !== null;

  if (!uploadZoneVisible && isNewRecord && currentState === "unmodified") {
    setUploadZoneVisible(true);
  }

  const handleFileDrop = (files: File[]): void => {
    if (files.length <= 0) {
      return;
    }
    setUploadPreviewURL(URL.createObjectURL(files[0]));
    setState("upload");
    onChange(property.name, files[0]);
    setUploadZoneVisible(false);
  };

  const onUploadClicked = (event: MouseEvent) => {
    event.preventDefault();
    setUploadZoneVisible(!uploadZoneVisible);
  };
  const onDeleteClicked = (event: MouseEvent) => {
    event.preventDefault();
    if (originalProperty.isRequired) {
      return;
    }
    setUploadPreviewURL(undefined);
    setUploadZoneVisible(false);
    if (isNewRecord) {
      setState("unmodified");
      onChange(property.name, undefined);
    } else {
      setState("delete");
      onChange(property.name, null);
    }
  };
  const onRestoreClicked = (event: MouseEvent) => {
    event.preventDefault();
    if (isNewRecord && originalProperty.isRequired) {
      return;
    }
    setUploadPreviewURL(undefined);
    setUploadZoneVisible(false);
    setState("unmodified");
    onChange(property.name, undefined);
  };

  // show delete only if:
  // - the image is not required
  // - and either:
  //   - a new photo was queued for upload
  //   - or a photo already exists and no modifications were made yet
  const showDeleteButton =
    !originalProperty.isRequired &&
    (currentState === "upload" ||
      (photoExists && currentState === "unmodified"));
  // hide upload only if we're on a new record and no image was uploaded yet
  const showUploadButton = !(isNewRecord && currentState === "unmodified");
  // show restore if:
  // - a modification was made
  // - and this is NOT a new record
  const showRestoreButton = currentState !== "unmodified" && !isNewRecord;
  const photoWillExist =
    (photoExists || currentState === "upload") && currentState !== "delete";
  const uploadButtonLabel = photoWillExist
    ? uploadZoneVisible
      ? translateButton("cancel", resourceId)
      : translateButton("save", resourceId)
    : uploadZoneVisible
      ? translateButton("cancel", resourceId)
      : translateButton("upload", resourceId);
  const uploadButtonVariant = uploadZoneVisible
    ? "secondary"
    : photoWillExist
      ? "info"
      : "success";

  const buttonStyle = {
    margin: "0.5em",
    marginLeft: 0,
  };

  return (
    <FormGroup>
      {/* minor code borrowing from adminjs (modified PropertyLabel, edit components for standard values) */}
      <Label required={originalProperty.isRequired}>
        {translateComponent("photoDropbox.labels.title", resourceId)}
        {property.description !== undefined && (
          <PropertyDescription property={originalExtendedProperty} />
        )}
      </Label>
      {!isNewRecord && (
        <div
          style={{ display: currentState === "unmodified" ? "block" : "none" }}
        >
          <PhotoDisplay isEmbedded={true} {...props} />
        </div>
      )}
      {uploadPreviewURL !== undefined && (
        <>
          <img
            src={uploadPreviewURL}
            alt={`Upload preview image for ${propertyName}`}
            style={{ maxHeight: "400px", maxWidth: "100%" }}
          />
          <br />
        </>
      )}
      {currentState === "delete" && (
        <>
          <span style={{ color: "orangered" }}>
            {translateComponent("photoDropbox.messages.deleted", resourceId)}
          </span>
          <br />
        </>
      )}
      {showUploadButton && (
        <Button
          onClick={onUploadClicked}
          variant={uploadButtonVariant}
          style={buttonStyle}
        >
          {uploadButtonLabel}
        </Button>
      )}
      {showDeleteButton && (
        <Button onClick={onDeleteClicked} variant="danger" style={buttonStyle}>
          {translateButton("delete", resourceId)}
        </Button>
      )}
      {showRestoreButton && (
        <Button onClick={onRestoreClicked} variant="info" style={buttonStyle}>
          {translateButton("restore", resourceId)}
        </Button>
      )}
      {uploadZoneVisible && (
        <div>
          <Label>
            {translateComponent("photoDropbox.messages.upload", resourceId)}
          </Label>
          <DropZone
            onChange={handleFileDrop}
            multiple={false}
            // idk, does not work passing just dropZone with { returnObjects: true } option
            translations={{
              placeholder: translateComponent("dropZone.placeholder"),
              acceptedSize: translateComponent("dropZone.acceptedSize"),
              acceptedType: translateComponent("dropZone.acceptedType"),
              unsupportedSize: translateComponent("dropZone.unsupportedSize"),
              unsupportedType: translateComponent("dropZone.unsupportedType"),
            }}
            validate={{ maxSize: MAX_FILE_SIZE, mimeTypes: ALLOWED_FILE_TYPES }}
          />
        </div>
      )}
    </FormGroup>
  );
};

export default PhotoDropbox;
