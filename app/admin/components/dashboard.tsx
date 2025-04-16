/* eslint-disable */
// @ts-nocheck
import {
  Box,
  H5,
  Illustration,
  IllustrationProps,
  Text,
} from "@adminjs/design-system";
import { styled } from "@adminjs/design-system/styled-components";
import { useTranslation } from "adminjs";
import React from "react";

// const { translateLabel } = useTranslation()

const boxes = () => [
  {
    href: "/admin/resources/about_us_general/records/1/show",
    variant: "Moon",
    subtitle: "aboutUs.subtitle",
  },
  {
    href: "/admin/resources/academic_calendars",
    variant: "Calendar",
    title: "calendars.title",
    subtitle: "calendars.subtitle",
  },
  {
    href: "/admin/resources/users",
    variant: "Clip",
    title: "admin.title",
    subtitle: "admin.subtitle",
  },
  {
    href: "/admin/resources/buildings",
    variant: "Launch",
    title: "buildings.title",
    subtitle: "buildings.subtitle",
  },
  {
    href: "/admin/resources/departments",
    variant: "Astronaut",
    title: "departments.title",
    subtitle: "departments.subtitle",
  },
  {
    href: "/admin/resources/guide_articles",
    variant: "FlagInCog",
    title: "guides.title",
    subtitle: "guides.subtitle",
  },
  {
    href: "/admin/resources/student_organizations",
    variant: "Rocket",
    title: "organizations.title",
    subtitle: "organizations.subtitle",
  },
  {
    href: "/admin/resources/versions",
    variant: "GithubLogo",
    title: "versions.title",
    subtitle: "versions.subtitle",
  },
];

const Card = styled(Box)`
  display: ${({ flex }): string => (flex ? "flex" : "block")};
  justify-content: ${({ flex }) => (flex ? "center" : "initial")};
  align-items: ${({ flex }) => (flex ? "center" : "initial")};
  color: ${({ theme }) => theme.colors.grey100};
  height: 100%;
  text-decoration: none;
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.space.md};
  transition: all 0.1s ease-in;
  &:hover {
    border: 1px solid ${({ theme }) => theme.colors.primary100};
    box-shadow: ${({ theme }) => theme.shadows.cardHover};
  }
`;

const defaultProps = { variant: "container", boxShadow: "card" };

export const Dashboard: React.FC = () => {
  const { translateComponent } = useTranslation();
  return (
    <Box
      mt={["xl", "xl"]}
      mb="xl"
      mx={[0, 0, 0, "auto"]}
      px={["default", "lg", "xxl", "0"]}
      position="relative"
      flex
      flexDirection="row"
      flexWrap="wrap"
      width={[1, 1, 1, 1024]}
    >
      {boxes().map((box, index) => (
        <Box key={index} width={[1, 1 / 2, 1 / 2, 1 / 3]} p="lg">
          <Card {...defaultProps} as="a" flex href={box.href}>
            <Text textAlign="center">
              <Illustration
                variant={box.variant as IllustrationProps["variant"]}
                width={100}
                height={70}
              />
              <H5 mt="lg">
                {box.title
                  ? translateComponent(`dashboard.${box.title}`)
                  : null}
              </H5>
              <Text>
                {box.subtitle
                  ? translateComponent(`dashboard.${box.subtitle}`)
                  : null}
              </Text>
            </Text>
          </Card>
        </Box>
      ))}
    </Box>
  );
};

export default Dashboard;
