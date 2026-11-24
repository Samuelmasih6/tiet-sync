# API documentation

Interactive OpenAPI documentation is available at `/swagger-ui.html` when the backend is running.

| Area | Endpoints |
|---|---|
| Auth | `POST /api/v1/auth/login`, `POST /api/v1/auth/register` |
| Dashboard | `GET /api/v1/dashboard` |
| Classroom/faculty | `GET /api/v1/classrooms?q=`, `GET /api/v1/faculty?q=`, `GET /api/v1/faculty/{id}/slots` |
| Coursework/attendance | `GET/POST /api/v1/assignments`, `PATCH /api/v1/assignments/{id}/complete`, `DELETE /api/v1/assignments/{id}`, `GET /api/v1/attendance` |
| Calendar/resources | `GET /api/v1/calendar`, `GET /api/v1/resources?q=` |
| Consultations | `GET/POST /api/v1/consultations`, `PATCH /api/v1/consultations/{id}` (faculty approve/reject), `PATCH /api/v1/consultations/{id}/cancel` (requesting student), `POST /api/v1/consultations/slots` |

Except auth and public catalogue reads, requests require `Authorization: Bearer <JWT>`. Registration accepts `STUDENT` or `FACULTY`; student registration requires a `@thapar.edu` email. Only students may create or cancel their pending requests; only the assigned faculty member may approve or reject them. Consultations use a unique slot constraint and transactional booking to prevent double booking.
