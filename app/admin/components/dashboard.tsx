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
import React from "react";

const boxes = () => [
  {
    href: "/admin/resources/about_us_general/records/1/show",
    variant: "Moon",
    title: "O nas",
    subtitle: "Poznaj nasz projekt",
  },
  {
    href: "/admin/resources/academic_calendars",
    variant: "Calendar",
    title: "Kalendarz akademicki",
    subtitle: `Kalendarz akademicki dla studentów. Sesje, przerwy, zamiany.`,
  },
  {
    href: "/admin/resources/users",
    variant: "Clip",
    title: "Panel admina",
    subtitle: "Panel administracyjny do zarządzania użytkownikami",
  },
  {
    href: "/admin/resources/buildings",
    variant: "Launch",
    title: "Budynki",
    subtitle: "Budynki i wielowarstwowa mapa uczelni",
  },
  {
    href: "/admin/resources/departments",
    variant: "Astronaut",
    title: "Wydziały",
    subtitle: "Wydziały i kierunki studiów na uczelni",
  },
  {
    href: "/admin/resources/guides",
    variant: "FlagInCog",
    title: "Przewodniki",
    subtitle: "Przewodniki dla studentów, pracowników i gości uczelni",
  },
  {
    href: "/admin/resources/student_organizations",
    variant: "Rocket",
    title: "Organizacje studenckie",
    subtitle: "Organizacje studenckie, koła naukowe, stowarzyszenia",
  },
  {
    href: "/admin/resources/versions",
    variant: "GithubLogo",
    title: "Wersje",
    subtitle: "Wersje aplikacji mobilnej i autorzy",
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
              <H5 mt="lg">{box.title}</H5>
              <Text>{box.subtitle}</Text>
            </Text>
          </Card>
        </Box>
      ))}
    </Box>
  );
};

export default Dashboard;
