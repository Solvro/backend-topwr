import Banner from "#models/banner";

import { ResourceBuilder } from "../resource_factory.js";

const navigation = {
  name: "Banners",
  icon: "GalleryHorizontal",
};

export const BannersBuilder: ResourceBuilder = {
  builders: [
    {
      forModel: Banner,
    },
  ],
  navigation,
};
