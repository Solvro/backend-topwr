import {
  academicCalendarResource,
  daySwapResource,
  holidayResource,
} from "./academic_calendars.js";
import {
  aedResource,
  bicycleShowerResource,
  buildingResource,
  campusResource,
  foodSpotResource,
  libraryResource,
  regularHourResource,
  specialHourResource,
} from "./buildings.js";
import { changeResource, changeScreenshotResource } from "./change.js";
import {
  contributorResource,
  contributorSocialLinksResource,
  milestoneResource,
  roleResource,
  versionResource,
  versionScreenshotResource,
} from "./contributor.js";
import {
  departmentResource,
  departmentsLinkResource,
  fieldsOfStudyResource,
  studentOrganizationLinkResource,
  studentOrganizationResource,
  studentOrganizationTagResource,
} from "./department.js";
import {
  guideArticleResource,
  guideAutherResource,
  guideQuestionResource,
} from "./guide_article.js";
import { userResource } from "./utils/user.js";

export const adminjsResources = [
  academicCalendarResource,
  buildingResource,
  campusResource,
  aedResource,
  bicycleShowerResource,
  changeResource,
  changeScreenshotResource,
  contributorResource,
  contributorSocialLinksResource,
  daySwapResource,
  departmentResource,
  departmentsLinkResource,
  fieldsOfStudyResource,
  foodSpotResource,
  guideArticleResource,
  guideAutherResource,
  guideQuestionResource,
  holidayResource,
  libraryResource,
  milestoneResource,
  regularHourResource,
  roleResource,
  specialHourResource,
  studentOrganizationResource,
  studentOrganizationLinkResource,
  studentOrganizationTagResource,
  userResource,
  versionResource,
  versionScreenshotResource,
];
