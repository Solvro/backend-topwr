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
  const { translateComponent, translateProperty } = useTranslation();
  const { property, record, resource, isEmbedded } = props;
  const [previewFetchResponse, setPreviewFetchResponse] = useState({
    isSuccess: false,
    urlOrMessage: translateComponent("photoDisplay.messages.fetching"),
  });

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

  useEffect(() => {
    const photoKey = (record?.params[propertyName] ?? null) as string | null;
    if (photoKey === null) {
      setPreviewFetchResponse({
        isSuccess: false,
        urlOrMessage: translateComponent(
          "photoDisplay.messages.noPhoto",
          resourceId,
        ),
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
          urlOrMessage: translateComponent(
            "photoDisplay.messages.notExist",
            resourceId,
          ),
        };
      }
      return {
        isSuccess: false,
        urlOrMessage: translateComponent(
          "photoDisplay.messages.fetching.errorWithStatus",
          resourceId,
          {
            status: response.statusText,
            response: response.text(),
          },
        ),
      };
    } catch (error) {
      console.error(`Error fetching preview URL for file ${key}`, error);
      return {
        isSuccess: false,
        urlOrMessage: translateComponent(
          "photodisplay.messages.fetching.error",
          resourceId,
          //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          { error },
        ),
      };
    }
  };

  const internalElement = previewFetchResponse.isSuccess ? (
    <img
      src={previewFetchResponse.urlOrMessage}
      alt={translateComponent("photoDisplay.messages.alt", {
        property: translateProperty(propertyName, resourceId),
      })}
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
        label={translateComponent("photoDisplay.labels.title", resourceId)}
      >
        {internalElement}
      </ValueGroup>
    );
  }
};

export default PhotoDisplay;
