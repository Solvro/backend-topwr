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
    name: "aboutUs",
  },
  {
    href: "/admin/resources/academic_calendars",
    variant: "Calendar",
    name: "calendars",
  },
  {
    href: "/admin/resources/users",
    variant: "Clip",
    name: "admin",
  },
  {
    href: "/admin/resources/buildings",
    variant: "Launch",
    name: "buildings",
  },
  {
    href: "/admin/resources/departments",
    variant: "Astronaut",
    name: "departments",
  },
  {
    href: "/admin/resources/guide_articles",
    variant: "FlagInCog",
    name: "guides",
  },
  {
    href: "/admin/resources/student_organizations",
    variant: "Rocket",
    name: "organizations",
  },
  {
    href: "/admin/resources/versions",
    variant: "GithubLogo",
    name: "versions",
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
                {box.name
                  ? translateComponent(`dashboard.${box.name}.title`)
                  : null}
              </H5>
              <Text>
                {box.name
                  ? translateComponent(`dashboard.${box.name}.subtitle`)
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
