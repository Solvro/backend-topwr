export enum ExternalDigitalGuideMode {
  WebUrl = "web_url",
  DigitalGuideBuilding = "digital_guide_building",
  OtherDigitalGuidePlace = "other_digital_guide_place",
}

export const externalDigitalGuideModeEnumsValues = {
  availableValues: [
    { value: ExternalDigitalGuideMode.WebUrl, label: "Web URL" },
    {
      value: ExternalDigitalGuideMode.DigitalGuideBuilding,
      label: "Digital Guide Building",
    },
    {
      value: ExternalDigitalGuideMode.OtherDigitalGuidePlace,
      label: "Other Digital Guide Place",
    },
  ],
};
