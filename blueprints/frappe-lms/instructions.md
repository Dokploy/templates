# Frappe LMS (Frappe Learning)

## Initial setup

The first deployment creates the Frappe site and installs the LMS app, which can take **3-6 minutes** after all containers are up. The site is ready when the domain returns the Frappe login page.

## Default credentials

- **Username:** `Administrator`
- **Password:** the value of the `ADMIN_PASSWORD` environment variable (auto-generated, check the Environment tab of the service)

After logging in, the learning portal is available at `/lms` and the Frappe admin backend at `/app`.

## Notes

- The template pins `ghcr.io/frappe/lms:v2.52.0`, the latest upstream image that ships the LMS app (newer upstream tags are currently published without the app baked in).
- The upstream image does not include the `payments` app, so paid-course checkout features are unavailable. Free courses, batches, quizzes and certifications work normally.
