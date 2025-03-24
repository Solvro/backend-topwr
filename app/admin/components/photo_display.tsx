import { ValueGroup } from "@adminjs/design-system";
import { BasePropertyJSON, BasePropertyProps, useTranslation } from "adminjs";
import React, { FC, useEffect, useState } from "react";

interface FetchResponse {
  isSuccess: boolean;
  urlOrMessage: string;
}
type DisplayProps = BasePropertyProps & {
  isEmbedded?: boolean;
};

const FILE_META_ENDPOINT = "/api/v1/files";

const PhotoDisplay: FC<DisplayProps> = (props) => {
  const { property, record, resource, isEmbedded } = props;
  const [previewFetchResponse, setPreviewFetchResponse] = useState({
    isSuccess: false,
    urlOrMessage: "Fetching preview URL...",
  });
  const { translateProperty } = useTranslation();

  const propertyName = property.name.substring(1);
  const originalProperty = resource.properties[propertyName] as
    | BasePropertyJSON
    | undefined;

  if (originalProperty === undefined) {
    throw new Error(
      `Invalid dropbox configuration. Original property '${propertyName}' for dropbox '${property.name}' is not defined.`,
    );
  }

  useEffect(() => {
    const photoKey = (record?.params[propertyName] ?? null) as string | null;
    if (photoKey === null) {
      setPreviewFetchResponse({
        isSuccess: false,
        urlOrMessage: "No photo uploaded yet.",
      });
    } else {
      // errors handled internally inside
      void getPreviewUrl(photoKey).then(setPreviewFetchResponse);
    }
  }, []);

  const getPreviewUrl = async (key: string): Promise<FetchResponse> => {
    try {
      // fun fact: fetch() resolves URLs relative to the current url
      const response = await fetch(`${FILE_META_ENDPOINT}/${key}`, {
        method: "GET",
      });
      if (response.ok) {
        const body = (await response.json()) as { url: string };
        return {
          isSuccess: true,
          urlOrMessage: body.url,
        };
      }
      if (response.status === 404) {
        return {
          isSuccess: false,
          urlOrMessage:
            "Photo of given key does not exist on disk. Please re-upload or replace it.",
        };
      }
      return {
        isSuccess: false,
        urlOrMessage: `Error fetching preview URL: ${response.statusText} -> ${await response.text()}`,
      };
    } catch (error) {
      console.error(`Error fetching preview URL for file ${key}`, error);
      return {
        isSuccess: false,
        urlOrMessage: `Error fetching preview URL: ${error}`,
      };
    }
  };

  const internalElement = previewFetchResponse.isSuccess ? (
    <img
      src={previewFetchResponse.urlOrMessage}
      alt={`Current ${propertyName} image`}
      style={{ maxHeight: "400px", maxWidth: "100%" }}
    />
  ) : (
    <span>{previewFetchResponse.urlOrMessage}</span>
  );

  if (isEmbedded ?? false) {
    return internalElement;
  } else {
    return (
      // minor code borrowing from adminjs (show components for standard values)
      <ValueGroup
        label={translateProperty(
          originalProperty.label,
          originalProperty.resourceId,
        )}
      >
        {internalElement}
      </ValueGroup>
    );
  }
};

export default PhotoDisplay;
