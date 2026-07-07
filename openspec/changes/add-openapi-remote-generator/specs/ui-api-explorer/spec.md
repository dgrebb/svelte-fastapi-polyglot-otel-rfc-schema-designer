## ADDED Requirements

### Requirement: Admin API explorer page

The UI SHALL provide a route at `/admin/api-explorer` that consumes generated endpoint metadata.

#### Scenario: Lists generated endpoints

- **WHEN** a developer navigates to `/admin/api-explorer`
- **THEN** the page displays a list of generated agents endpoints showing HTTP method, path, and remote function name

### Requirement: Try-it-out form submission

The explorer SHALL allow submitting at least one generated form remote and display the result.

#### Scenario: Create agent via explorer

- **WHEN** a user fills in required fields and submits the create-agent form
- **THEN** the page displays the validated JSON response from the backend
- **OR** displays validation or backend error details on failure
