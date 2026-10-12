# Beginner Deployment Guide

This setup uses **one Hugging Face Docker Space for the complete backend**:
the Node API and both Python services run inside the same container. The
React/Vite frontend is deployed separately to Vercel. This keeps the service
URLs and setup simpler than creating three backend Spaces.

## Before you start

Have these accounts/configuration ready:

- Hugging Face account.
- Git installed and configured on your computer.
- Roboflow API key and the full inference URL for your detection workflow.
- An API key for one supported LLM provider. The steps below use Groq.
- MongoDB Atlas connection string if board records must survive restarts.

Do not put API keys in GitHub, source files, screenshots, or chat. Add them only
as Hugging Face Space secrets.

## 1. Create the Hugging Face Space

1. Sign in at [Hugging Face](https://huggingface.co/).
2. Open **Spaces** and choose **Create new Space**.
3. Choose a Space name, for example `boardsnap-api`.
4. Choose **Docker** as the Space SDK. The repository already includes a
   `Dockerfile` and Space metadata in the root `README.md`.
5. Choose Public or Private, accept the terms, and create the Space.

The Space URL will look like:

```text
https://YOUR-HF-USERNAME-boardsnap-api.hf.space
```

Use the URL shown on your Space page; do not guess it.

## 2. Copy the project into the Space repository

Open PowerShell and replace `YOUR-HF-USERNAME` and the Space name below. This
clones the new Space repository, copies the project files without copying local
Git data or local dependencies, then pushes the files to Hugging Face:

```powershell
git clone https://huggingface.co/spaces/YOUR-HF-USERNAME/boardsnap-api "$HOME\boardsnap-hf"
robocopy "E:\BoardSnap-hackathon" "$HOME\boardsnap-hf" /E /XD .git node_modules .venv dist uploads roboflow /XF .env
Set-Location "$HOME\boardsnap-hf"
git add -A
git commit -m "Deploy BoardSnap backend"
git push
```

When Git asks for credentials, use your Hugging Face username and a Hugging Face
access token with **write** permission as the password. Create the token from
your Hugging Face account settings. Type it only into Git's password prompt;
do not add it to a command or file. If the first commit says there is nothing
to commit, check that the `robocopy` command completed and the copied files
include `Dockerfile` and `start.sh`.

## 3. Add Space variables and secrets

Open the Space's **Settings** page. Add these under **Variables and secrets**.
Secrets are hidden values; ordinary variables are configuration values.

| Name | Type | Value |
| --- | --- | --- |
| `LLM_PROVIDER` | Variable | `groq` |
| `GROQ_MODEL` | Variable | `openai/gpt-oss-120b` |
| `GROQ_API_KEY` | Secret | Your Groq API key |
| `ROBOFLOW_API_KEY` | Secret | Your Roboflow API key |
| `ROBOFLOW_WORKFLOW_URL` | Secret | Full detection workflow inference URL |
| `ROBOFLOW_OCR_WORKFLOW_URL` | Variable | Full OCR workflow URL |
| `MONGODB_URI` | Secret | MongoDB Atlas connection string |
| `MONGODB_DATABASE` | Variable | `boardsnap` |
| `CORS_ORIGIN` | Variable | `*` for the first connection test; restrict it to your Vercel origin later |

If you do not yet have MongoDB configured, leave `MONGODB_URI` unset for a
short-lived smoke test. Board records will then be kept in memory and lost when
the Space restarts.

After saving the settings, open **Logs** and wait for the Docker build and
startup to finish. The startup log should report that the Vision service, LLM
service, and API are running. The first build may take several minutes because
the Vision image installs CPU PyTorch and OCR dependencies.

## 4. Check the API

Open this URL in a browser, replacing the username and Space name with the
values shown on Hugging Face:

```text
https://YOUR-SPACE-URL/api/health
```

You should get JSON with `"status":"ok"`. If not, open **Logs** and resolve the
reported build/startup error before configuring the frontend.

## 5. Deploy the frontend to Vercel

1. Sign in to [Vercel](https://vercel.com/) and choose **Add New → Project**.
2. Import `Muavia-Ateeq/Boardsnap_project` from GitHub.
3. Set **Root Directory** to `frontend`.
4. Use the Vite defaults: build command `npm run build`, output directory
   `dist`, install command `npm install`.
5. Before deploying, add an environment variable:

   ```text
   Name: VITE_API_BASE_URL
   Value: https://YOUR-SPACE-URL/api
   ```

6. Deploy and open the Vercel URL. The top badge should change to `API: LIVE`
   when the API health check succeeds.

After Vercel gives you the final site URL (for example,
`https://boardsnap-project.vercel.app`), go back to Hugging Face Space Settings
and change `CORS_ORIGIN` from `*` to that exact origin, without a trailing
slash. Save/restart the Space, then redeploy or refresh the Vercel site.

If you use both a Vercel preview domain and a production domain, list both
origins separated by a comma in `CORS_ORIGIN`.

## 6. Configure durable storage before real use

MongoDB stores board records, but original and cleaned images are written to
the container filesystem. The Docker default upload directory is temporary.
For files to survive Space restarts, enable persistent storage for the Space
(if available for your plan) and set this Space variable:

```text
UPLOAD_DIR=/data/uploads
```

Without persistent storage, treat uploads as temporary demo data. MongoDB Atlas
must also allow connections from the deployed service; use a strong database
user/password and grant access only to the required database.

## Troubleshooting

- **Space fails during build:** open the Space **Logs** and inspect the first
  failed installation/build command.
- **`/api/health` does not load:** make sure the Space finished starting and
  check that the Space URL includes `/api/health`.
- **Frontend says `API: DEMO MODE`:** check `VITE_API_BASE_URL`, ensure it ends
  in `/api`, and redeploy Vercel after changing it.
- **Browser reports a CORS error:** set `CORS_ORIGIN` to the exact Vercel
  origin, save/restart the Space, and reload the site.
- **Image previews are broken:** verify the deployed API has the uploaded
  files. Temporary container storage is cleared on restart.
- **Uploads fail:** the API default size limit is 10 MB. Check the Space logs
  and the returned upload error.
- **LLM or vision requests fail:** verify the provider keys and exact workflow
  URLs in Space Settings. A running health endpoint does not prove those
  third-party credentials are valid; test by processing a real image.
