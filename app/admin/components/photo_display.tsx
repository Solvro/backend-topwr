import { Box } from "@adminjs/design-system";
import { BasePropertyProps } from "adminjs";
import React, { FC, useEffect, useState } from "react";

interface FetchResponse {
  isSuccess: boolean;
  urlOrMessage: string;
}

const FILE_ENDPOINT = "http://localhost:3333/api/v1/files/";

const PhotoDisplay: FC<BasePropertyProps> = (props) => {
  const { property, record } = props;
  const [previewFetchResponse, setPreviewFetchResponse] = useState({
    isSuccess: false,
    urlOrMessage: "Fetching preview URL...",
  });
  const propertyName = property.name.substring(1);

  let photoKey: string | undefined;

  if (record?.params[propertyName] === undefined) {
    throw new Error(
      `Invalid dropbox configuration. ${property.name} photoKey does not exist in record params.`,
    );
  } else if (record.params[propertyName] !== null) {
    photoKey = record.params[propertyName] as string;
  }

  useEffect(() => {
    if (photoKey === undefined) {
      setPreviewFetchResponse({
        isSuccess: false,
        urlOrMessage: "No photo uploaded yet.",
      });
    } else {
      async function loadPreview(key: string) {
        setPreviewFetchResponse(await getPreviewUrl(key));
      }

      void loadPreview(photoKey);
    }
  }, []);

  const getPreviewUrl = async (key: string): Promise<FetchResponse> => {
    try {
      const response = await fetch(FILE_ENDPOINT + key, {
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
      return {
        isSuccess: false,
        urlOrMessage: `Error fetching preview URL: ${error}`,
      };
    }
  };

  return (
    <Box
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        marginBottom: "16px",
      }}
    >
      <span>Current photo for {propertyName}:</span>
      {previewFetchResponse.isSuccess && (
        <div style={{ gap: "16px", display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <img
              src={previewFetchResponse.urlOrMessage}
              alt="Current photo"
              style={{ maxHeight: "400px", maxWidth: "100%" }}
            />
          </div>
        </div>
      )}
      {!previewFetchResponse.isSuccess && (
        <span>{previewFetchResponse.urlOrMessage}</span>
      )}
    </Box>
  );
};

export default PhotoDisplay;
