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
