export enum LinkType {
  TopwrBuildings = "topwr:buildings",
  Phone = "tel",
  Mail = "mailto:",
  Default = "default",
  Facebook = "facebook",
  Instagram = "instagram",
  Discord = "discord",
  LinkedIn = "linkedin",
  GitHub = "github",
  X = "https://x.com",
  YouTube = "youtu",
  TikTok = "tiktok",
  Twitch = "twitch",
}

export function stringToLinkType(value: string): LinkType {
  return (
    Object.values(LinkType).find(
      (enumValue) => enumValue.toString() === value,
    ) ?? LinkType.Default
  );
}

export const linkTypeOrder: LinkType[] = [
  LinkType.TopwrBuildings, // 1
  LinkType.Phone, // 2
  LinkType.Default, // 3
  LinkType.Mail, // 4
  LinkType.Facebook, // 5
  LinkType.Instagram, // 6
  LinkType.Discord, // 7
  LinkType.LinkedIn, // 8
  LinkType.GitHub, // 9
  LinkType.X, // 10
  LinkType.YouTube, // 11
  LinkType.TikTok, // 12
  LinkType.Twitch, // 13
];

export const aboutUsLinkTypeOrder: LinkType[] = [
  LinkType.TopwrBuildings, // 1
  LinkType.Phone, // 2
  LinkType.Mail, // 3
  LinkType.Default, // 4
  LinkType.GitHub, // 5
  LinkType.LinkedIn, // 6
  LinkType.Facebook, // 7
  LinkType.Instagram, // 8
  LinkType.Discord, // 9
  LinkType.X, // 10
  LinkType.YouTube, // 11
  LinkType.TikTok, // 12
  LinkType.Twitch, // 13
];

export function compareLinkTypes(
  typeA: LinkType,
  typeB: LinkType,
  order: LinkType[],
): number {
  return order.indexOf(typeA) - order.indexOf(typeB);
}

export const applyLinkTypeSorting = `
        CASE link_type
          WHEN 'topwr:buildings' THEN 1
          WHEN 'tel' THEN 2
          WHEN 'default' THEN 3
          WHEN 'mailto:' THEN 4
          WHEN 'facebook' THEN 5
          WHEN 'instagram' THEN 6
          WHEN 'discord' THEN 7
          WHEN 'linkedin' THEN 8
          WHEN 'github' THEN 9
          WHEN 'https://x.com' THEN 10
          WHEN 'youtu' THEN 11
          WHEN 'tiktok' THEN 12
          WHEN 'twitch' THEN 13
        END
      `;

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

export interface DetectionResult {
  type: LinkType;
  warning?: string;
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
