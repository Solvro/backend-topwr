export const readOnlyTimestamps = {
  createdAt: {
    type: "datetime",
    isVisible: {
      edit: false,
      show: true,
      list: false,
      filter: true,
    },
  },
  updatedAt: {
    type: "datetime",
    isVisible: {
      edit: false,
      show: true,
      list: false,
      filter: true,
    },
  },
};
