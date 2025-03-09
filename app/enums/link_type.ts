export enum LinkType {
  Default = "default",
  Facebook = "facebook",
  Instagram = "instagram",
  LinkedIn = "linkedin",
  Mail = "mailto:",
  YouTube = "youtu",
  GitHub = "github",
  TopwrBuildings = "topwr:buildings",
  Phone = "tel",
  X = "https://x.com",
  TikTok = "tiktok",
  Discord = "discord",
  Twitch = "twitch",
}

export const linkTypeEnumsValues = {
  availableValues: [
    { value: LinkType.Default, label: "Default" },
    { value: LinkType.Facebook, label: "Facebook" },
    { value: LinkType.Instagram, label: "Instagram" },
    { value: LinkType.LinkedIn, label: "LinkedIn" },
    { value: LinkType.Mail, label: "Email" },
    { value: LinkType.YouTube, label: "YouTube" },
    { value: LinkType.GitHub, label: "GitHub" },
    { value: LinkType.TopwrBuildings, label: "TopwrBuildings" },
    { value: LinkType.Phone, label: "Phone" },
    { value: LinkType.X, label: "X" },
    { value: LinkType.TikTok, label: "TikTok" },
    { value: LinkType.Discord, label: "Discord" },
    { value: LinkType.Twitch, label: "Twitch" },
  ],
};

const linkDomains: [string, LinkType][] = [
  ["facebook.com", LinkType.Facebook],
  ["instagram.com", LinkType.Instagram],
  ["linkedin.com", LinkType.LinkedIn],
  ["youtube.com", LinkType.YouTube],
  ["github.com", LinkType.GitHub],
  ["x.com", LinkType.X],
  ["twitter.com", LinkType.X],
  ["discord.com", LinkType.Discord],
  ["discord.gg", LinkType.Discord],
  ["tiktok.com", LinkType.TikTok],
  ["twitch.tv", LinkType.Twitch],
];

/**
 * Detects the link type of the given URL.
 *
 * This should never throw or return null/undefined - instead it may include the `warning` field in the result if any issues are encountered.
 * Make sure to check if this field is not undefined and handle the warning appropriately (such as by logging it)
 * @param link - the URL to examine
 * @returns an object with the detected link type and an optional warning
 */
export function detectLinkType(link: string): {
  type: LinkType;
  warning?: string;
} {
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
  for (const [domain, type] of linkDomains) {
    if (url.host === domain || url.host.endsWith(`.${domain}`)) {
      return { type };
    }
  }
  return {
    type: LinkType.Default,
    warning: `Social link '${link}' matched no domains - assigned the Default linktype`,
  };
}
