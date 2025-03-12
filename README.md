# ToPWR Backend

![Solvro banner](https://github.com/Solvro/backend-topwr-sks/blob/main/assets/solvro_dark.png#gh-dark-mode-only)
![Solvro banner](https://github.com/Solvro/backend-topwr-sks/blob/main/assets/solvro_dark.png#gh-light-mode-only)

## API Documentation

### Disclaimer

Documentation and API are in WiP stage

AI generated

### Endpoints

#### Files

- **GET /api/v1/files/:key**
  - Description: Retrieve a file by its key.
  - Response: File data.
- **POST /api/v1/files**
  - Description: Upload a new file.
  - Response: Key of the newly uploaded file.

#### Campuses

- **GET /api/v1/campuses/:id**
  - Description: Retrieve a campus by its ID.
  - Response: Campus data.
- **GET /api/v1/campuses**
  - Description: List all campuses.
  - Response: Array of campus data.

#### Buildings

- **GET /api/v1/buildings/:id**
  - Description: Retrieve a building by its ID.
  - Response: Building data.
- **GET /api/v1/buildings**
  - Description: List all buildings.
  - Response: Array of building data.

#### Libraries

- **GET /api/v1/libraries/:id**
  - Description: Retrieve a library by its ID.
  - Response: Library data.
- **GET /api/v1/libraries**
  - Description: List all libraries.
  - Response: Array of library data.

#### Student Organizations

- **GET /api/v1/student_organizations/:id**
  - Description: Retrieve a student organization by its ID.
  - Response: Student organization data.
- **GET /api/v1/student_organizations**
  - Description: List all student organizations.
  - Response: Array of student organization data.

#### Roles

- **GET /api/v1/roles/:id**
  - Description: Retrieve a role by its ID.
  - Response: Role data.
- **GET /api/v1/roles**
  - Description: List all roles.
  - Response: Array of role data.

#### Contributors

- **GET /api/v1/contributors/:id**
  - Description: Retrieve a contributor by its ID.
  - Response: Contributor data.
- **GET /api/v1/contributors**
  - Description: List all contributors.
  - Response: Array of contributor data.

#### Milestones

- **GET /api/v1/milestones/:id**
  - Description: Retrieve a milestone by its ID.
  - Response: Milestone data.
- **GET /api/v1/milestones**
  - Description: List all milestones.
  - Response: Array of milestone data.

#### Versions

- **GET /api/v1/versions/:id**
  - Description: Retrieve a version by its ID.
  - Response: Version data.
- **GET /api/v1/versions**
  - Description: List all versions.
  - Response: Array of version data.

#### Changes

- **GET /api/v1/changes/:id**
  - Description: Retrieve a change by its ID.
  - Response: Change data.
- **GET /api/v1/changes**
  - Description: List all changes.
  - Response: Array of change data.

#### Departments

- **GET /api/v1/departments/:id**
  - Description: Retrieve a department by its ID.
  - Response: Department data.
- **GET /api/v1/departments**
  - Description: List all departments.
  - Response: Array of department data.

#### Fields of Study

- **GET /api/v1/fields_of_study/:id**
  - Description: Retrieve a field of study by its ID.
  - Response: Field of study data.
- **GET /api/v1/fields_of_study**
  - Description: List all fields of study.
  - Response: Array of field of study data.

#### Guide Articles

- **GET /api/v1/guide_articles/:id**
  - Description: Retrieve a guide article by its ID.
  - Response: Guide article data.
- **GET /api/v1/guide_articles**
  - Description: List all guide articles.
  - Response: Array of guide article data.

#### Guide Authors

- **GET /api/v1/guide_authors/:id**
  - Description: Retrieve a guide author by its ID.
  - Response: Guide author data.
- **GET /api/v1/guide_authors**
  - Description: List all guide authors.
  - Response: Array of guide author data.

#### Guide Questions

- **GET /api/v1/guide_questions/:id**
  - Description: Retrieve a guide question by its ID.
  - Response: Guide question data.
- **GET /api/v1/guide_questions**
  - Description: List all guide questions.
  - Response: Array of guide question data.

#### About Us

- **GET /api/v1/about_us**
  - Description: Retrieve information about us.
  - Response: About us data.

#### Academic Calendars

- **GET /api/v1/academic_calendars/:id**
  - Description: Retrieve an academic calendar by its ID.
  - Response: Academic calendar data.
- **GET /api/v1/academic_calendars**
  - Description: List all academic calendars.
  - Response: Array of academic calendar data.

#### Holidays

- **GET /api/v1/holidays/:id**
  - Description: Retrieve a holiday by its ID.
  - Response: Holiday data.
- **GET /api/v1/holidays**
  - Description: List all holidays.
  - Response: Array of holiday data.

#### Day Swaps

- **GET /api/v1/day_swaps/:id**
  - Description: Retrieve a day swap by its ID.
  - Response: Day swap data.
- **GET /api/v1/day_swaps**
  - Description: List all day swaps.
  - Response: Array of day swap data.

### Query scopes

The API provides flexible query options to retrieve building records efficiently. Below are examples demonstrating how to use query parameters for pagination, sorting, searching, and preloading relations.

#### 1. Fetching a Paginated List of Student Organizations

```
GET https://api.topwr.solvro.pl/api/v1/student_organizations?page=1&limit=20
```

- Retrieves student organizations with pagination.
- Limits results to 20 per page.

#### 2. Searching for Student Organizations by Exact Name

```
GET https://api.topwr.solvro.pl/api/v1/student_organizations?name=kn+solvro
```

- Filters student organizations with the exact name "kn solvro".

#### 3. Searching for Student Organizations Using LIKE Query

```
GET https://api.topwr.solvro.pl/api/v1/student_organizations?name=%solvro
```

- Filters student organizations with names containing "solvro".

#### 4. Sorting Student Organizations in Ascending Order

```
GET https://api.topwr.solvro.pl/api/v1/student_organizations?sort=+name
```

- Sorts student organizations by name in ascending order.

#### 5. Sorting Student Organizations in Descending Order

```
GET https://api.topwr.solvro.pl/api/v1/student_organizations?sort=-name
```

- Sorts student organizations by name in descending order.

#### 6. Preloading Relations for Student Organizations

```
GET https://api.topwr.solvro.pl/api/v1/student_organizations?tags=true
```

- Preloads related `tags` data for student organizations.

## Links

[![docs.solvro.pl](https://i.imgur.com/fuV0gra.png)](https://docs.solvro.pl)
