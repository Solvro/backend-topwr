import { ActionRequest } from "adminjs";

import logger from "@adonisjs/core/services/logger";

export enum LinkType {
  TopwrBuildings = "topwr:buildings",
  Phone = "tel",
  Mail = "mailto:",
  Facebook = "facebook",
  Instagram = "instagram",
  Discord = "discord",
  LinkedIn = "linkedin",
  GitHub = "github",
  X = "https://x.com",
  YouTube = "youtu",
  TikTok = "tiktok",
  Twitch = "twitch",
  Default = "default",
}

export const linkTypeEnumsValues = [
  { value: LinkType.TopwrBuildings, label: "TopwrBuildings" },
  { value: LinkType.Phone, label: "Phone" },
  { value: LinkType.Mail, label: "Email" },
  { value: LinkType.Facebook, label: "Facebook" },
  { value: LinkType.Instagram, label: "Instagram" },
  { value: LinkType.Discord, label: "Discord" },
  { value: LinkType.LinkedIn, label: "LinkedIn" },
  { value: LinkType.GitHub, label: "GitHub" },
  { value: LinkType.X, label: "X" },
  { value: LinkType.YouTube, label: "YouTube" },
  { value: LinkType.TikTok, label: "TikTok" },
  { value: LinkType.Twitch, label: "Twitch" },
  { value: LinkType.Default, label: "Default" },
];

const linkPatterns: [string, RegExp | undefined, LinkType][] = [
  ["facebook.com", undefined, LinkType.Facebook],
  ["instagram.com", undefined, LinkType.Instagram],
  ["linkedin.com", undefined, LinkType.LinkedIn],
  ["youtube.com", undefined, LinkType.YouTube],
  ["github.com", undefined, LinkType.GitHub],
  ["x.com", undefined, LinkType.X],
  ["twitter.com", undefined, LinkType.X],
  ["discord.com", undefined, LinkType.Discord],
  ["discord.gg", undefined, LinkType.Discord],
  ["tiktok.com", undefined, LinkType.TikTok],
  ["twitch.tv", undefined, LinkType.Twitch],
  ["topwr.solvro.pl", /^\/buildings\/\d+$/i, LinkType.TopwrBuildings],
  ["pwr.edu.pl", undefined, LinkType.Default],
];

/**
 * Spread this in a model with 'link' and 'linkType' properties for automatic link detection configuration.
 * Remember to add new properties instead of overriding existing ones.
 */
export const linkTypeAutodetectSetUp = {
  additionalProperties: {
    linkType: {
      availableValues: linkTypeEnumsValues,
      isVisible: {
        list: true,
        show: true,
        filter: true,
        edit: false,
      },
    },
  },
  additionalActions: {
    new: {
      before: autoReplaceLinkType,
    },
    edit: {
      before: autoReplaceLinkType,
    },
  },
};

export interface DetectionResult {
  type: LinkType;
  warning?: string;
}

/**
 *  Function to add a hook on an Admin Panel field with a link.
 *  It will automatically set the 'linkType' property of a model with a link field.
 *  This hook will override any user-chosen link type value and, as such,
 *  it is advised to set 'type' property visibility to false on new and edit views.
 *  Use the 'linkTypeAutodetectSetUp' instead of directly using this function if possible.
 */
export async function autoReplaceLinkType(
  request: ActionRequest,
): Promise<ActionRequest> {
  if (request.payload !== undefined) {
    if (request.payload.link !== undefined) {
      if (typeof request.payload.link !== "string") {
        throw new Error("Link must be a string");
      }
      const detectedType: DetectionResult = detectLinkType(
        request.payload.link,
      );
      if (detectedType.warning !== undefined) {
        logger.info(detectedType.warning);
      }
      request.payload.linkType = detectedType.type;
    }
  }
  return request;
}

/**
 * Detects the link type of the given URL.
 *
 * This should never throw or return null/undefined – instead it may include the `warning` field in the result if any issues are encountered.
 * Make sure to check if this field is not undefined and handle the warning appropriately (such as by logging it)
 * @param link - the URL to examine
 * @returns an object with the detected link type and an optional warning
 */
export function detectLinkType(link: string): DetectionResult {
  let url;
  try {
    url = new URL(link);
  } catch {
    return {
      type: LinkType.Default,
      warning: `Failed to parse social link '${link}' - assigned the Default linktype`,
    };
  }
  if (url.protocol === "mailto:") {
    return { type: LinkType.Mail };
  }
  if (url.protocol === "tel:") {
    return { type: LinkType.Phone };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return {
      type: LinkType.Default,
      warning: `Encountered an unknown protocol '${url.protocol}' in social link '${link}' - assigned the Default linktype`,
    };
  }
  for (const [domain, pathPattern, type] of linkPatterns) {
    if (
      (url.host === domain || url.host.endsWith(`.${domain}`)) &&
      (pathPattern === undefined || pathPattern.test(url.pathname))
    ) {
      return { type };
    }
  }
  return {
    type: LinkType.Default,
    warning: `Social link '${link}' matched no known patterns - assigned the Default linktype`,
  };
}
