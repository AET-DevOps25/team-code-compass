# GitHub Container Registry Setup Guide

## Prerequisites

1. GitHub account with access to the repository
2. Docker installed locally
3. Repository must have Actions enabled

## Step 1: Test Locally First

```bash
# Build images locally
docker compose build

# Run locally to ensure everything works
docker compose up -d

# Check services
docker compose ps
```

## Step 2: GitHub Actions Permissions

1. Go to: Settings > Actions > General
2. Under "Workflow permissions", select:
   - "Read and write permissions"
   - "Allow GitHub Actions to create and approve pull requests" (optional)

## Step 3: Test GitHub Container Registry

1. Push the test workflow to GitHub:
   ```bash
   git add .github/workflows/test-ghcr.yml
   git commit -m "Add test workflow for GitHub Container Registry"
   git push
   ```

2. Go to Actions tab in GitHub
3. Select "Test GitHub Container Registry" workflow
4. Click "Run workflow" > "Run workflow"
5. Watch the logs to ensure it builds and pushes successfully

## Step 4: Check Your Package

1. Go to your GitHub profile or organization
2. Click on "Packages" tab
3. You should see `team-code-compass/service-registry`
4. Click on it to see details

## Step 5: Make Package Public (Optional)

1. In the package page, click "Package settings"
2. Scroll to "Danger Zone"
3. Change visibility to "Public"

## Step 6: Pull Image Locally (Test)

```bash
# If package is public:
docker pull ghcr.io/aet-devops25/team-code-compass/service-registry:main

# If package is private, login first:
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin
docker pull ghcr.io/aet-devops25/team-code-compass/service-registry:main
```

## Step 7: Use in Production

Once confirmed working, update your production docker-compose:

```yaml
services:
  service-registry:
    image: ghcr.io/aet-devops25/team-code-compass/service-registry:${TAG:-latest}
    # Remove or comment out the build section for production
    # build: ./server/service-registry
```

## Troubleshooting

### Permission Denied
- Ensure workflow has `packages: write` permission
- Check repository settings for Actions permissions

### Image Not Found
- Verify the image path matches exactly
- Check if package is private and you're authenticated
- Ensure the workflow completed successfully

### Local Development
- Use `docker compose up` (uses docker-compose.yml + docker-compose.override.yml)
- For production: `docker compose -f docker-compose.yml up`

## Image Naming Convention

```
ghcr.io/<owner>/<repository>/<service-name>:<tag>

Example:
ghcr.io/aet-devops25/team-code-compass/frontend:v1.0.0
ghcr.io/aet-devops25/team-code-compass/api-gateway:latest
ghcr.io/aet-devops25/team-code-compass/user-service:main
```