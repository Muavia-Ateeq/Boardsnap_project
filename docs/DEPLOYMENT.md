# Free beginner deployment: Render backend + Vercel frontend

This setup hosts the combined Node/Python backend on a **Render Free web
service** and the React/Vite frontend on Vercel. The project is already in the
GitHub repository `Muavia-Ateeq/Boardsnap_project`.

Render supports Docker web services on its Free plan. This Docker build omits
the large local PyTorch/EasyOCR stack: deployed OCR and detection use the
configured hosted Roboflow workflows. The full local OCR dependencies remain
available for development in `vision/requirements.txt`.

## Free-plan limitations

Render Free is for hobby projects and testing, not production:

- The backend spins down after 15 minutes without traffic; its first request
  after sleeping can take about a minute.
- Its filesystem is temporary. Uploaded images are lost when the service
  restarts, redeploys, or spins down.
- Without `MONGODB_URI`, board records are kept in memory and are also lost
  when the service restarts.
- A free deployment is not guaranteed to meet every resource need. If Render
  reports that the service exceeded its resources, stop and share the relevant
  deploy/runtime log rather than upgrading or adding a payment method.
- Hosting may be free, but external providers such as Roboflow, Groq, Gemini,
  and MongoDB have their own quotas and billing terms.

For durable image storage, add an object-storage provider later. MongoDB alone
does not preserve uploaded image files.

## Before starting

Have these ready:

- Access to the GitHub repository `Muavia-Ateeq/Boardsnap_project`.
- A Render account and a Vercel account.
- A Roboflow API key and the full detection workflow URL.
- A Groq API key. You can use another supported LLM provider instead, but the
  steps below configure Groq.
- Optionally, a MongoDB Atlas connection string for board-record persistence.

Never commit a key to GitHub or paste one into chat. Add keys only to the
hosting provider's environment-variable settings.

## 1. Deploy the backend on Render

1. Sign in to [Render](https://render.com/) and choose **New → Web Service**.
2. Connect GitHub if asked, then select
   `Muavia-Ateeq/Boardsnap_project` and the `main` branch.
3. Configure the service:
   - **Runtime / Language:** Docker
   - **Dockerfile path:** `./Dockerfile`
   - **Root directory:** leave blank
   - **Instance type:** Free
   - **Health check path:** `/api/health`
4. Add the environment variables below. Enter API keys as secret values.

   | Name | Value |
   | --- | --- |
   | `LLM_PROVIDER` | `groq` |
   | `GROQ_MODEL` | `openai/gpt-oss-120b` |
   | `GROQ_API_KEY` | Your Groq API key (secret) |
   | `ROBOFLOW_API_KEY` | Your Roboflow API key (secret) |
   | `ROBOFLOW_WORKFLOW_URL` | Full detection workflow URL |
   | `ROBOFLOW_OCR_WORKFLOW_URL` | Full OCR workflow URL |
   | `CORS_ORIGIN` | `*` temporarily, until the frontend is deployed |
   | `MONGODB_URI` | Optional Atlas connection string (secret) |
   | `MONGODB_DATABASE` | `boardsnap` |

   `PORT`, the internal service URLs, and
   `ALLOW_LOCAL_OCR_FALLBACK=false` are configured for the container. Do not
   replace the Docker start command.

5. Choose **Create Web Service** and wait for the first build and deploy to
   finish. This image uses the smaller deployment dependency list, but its
   first build may still take several minutes.
6. Copy the Render URL shown on the service page. Check it in a browser by
   opening:

   ```text
   https://YOUR-RENDER-SERVICE.onrender.com/api/health
   ```

   A JSON response containing `"status":"ok"` means the API process is
   responding. It does not verify your Roboflow/Groq keys; test a real image
   after the frontend is connected.

If deployment fails, open the Render service's **Events** or **Logs** and
inspect the first build/runtime error. Do not share secret values when asking
for help.

## 2. Deploy the frontend on Vercel

1. Sign in to [Vercel](https://vercel.com/) and choose **Add New → Project**.
2. Import `Muavia-Ateeq/Boardsnap_project`.
3. Set **Root Directory** to `frontend`.
4. Use:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`
5. Add this environment variable before deploying:

   ```text
   Name: VITE_API_BASE_URL
   Value: https://YOUR-RENDER-SERVICE.onrender.com/api
   ```

6. Deploy and copy the Vercel site URL.

## 3. Restrict CORS to your deployed site

In Render, edit `CORS_ORIGIN` to the exact Vercel origin, without a trailing
slash, for example:

```text
https://boardsnap-project.vercel.app
```

If you need both a preview and production domain, separate the exact origins
with a comma. Save the change and wait for Render to redeploy. Keep `*` only
for a temporary connectivity check.

## 4. Check the connected app

- Open the Vercel site and wait for the API status to report live. The first
  request after Render has spun down may be slow.
- Upload a test image. The Roboflow detector and OCR workflow must be
  configured and reachable for image processing to complete.
- If you set up MongoDB, verify that Atlas allows the deployed service to
  connect. Without it, records are temporary.
- Remember: Render Free has no persistent disk for this service, so uploaded
  image previews can stop working after a restart or spin-down.

## Troubleshooting

- **Build fails:** inspect the first failed command in Render's deploy logs.
- **Service fails its health check:** verify `/api/health` works on the
  Render URL and check that the container started all three services.
- **Frontend remains in demo mode:** confirm `VITE_API_BASE_URL` ends with
  `/api`, then redeploy the Vercel project.
- **CORS error:** set `CORS_ORIGIN` to the exact Vercel origin and wait for
  Render to redeploy.
- **Processing fails:** check that the Roboflow API key and both workflow
  URLs are correct, and that the selected LLM provider key is valid.
- **Render reports resource exhaustion:** share the relevant error/log text
  without secrets. Do not assume the free service can run this workload until
  its first deployment and image-processing request succeed.
