# Setting Up GitHub Repository

Your Vantus project is now ready to be pushed to GitHub! Follow these steps:

## Option 1: Using GitHub CLI (if installed)

```bash
cd /Users/emilyfehr8/CascadeProjects/vantus

# Create repository on GitHub
gh repo create vantus-prototype --public --source=. --remote=origin --push

# Or for private repository:
gh repo create vantus-prototype --private --source=. --remote=origin --push
```

## Option 2: Using GitHub Web Interface

1. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Repository name: `vantus-prototype` (or your preferred name)
   - Description: "Real-time tactical threat detection system prototype"
   - Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
   - Click "Create repository"

2. **Connect and push your local repository:**
   ```bash
   cd /Users/emilyfehr8/CascadeProjects/vantus
   
   # Add the remote (replace YOUR_USERNAME with your GitHub username)
   git remote add origin https://github.com/YOUR_USERNAME/vantus-prototype.git
   
   # Rename branch to main (if needed)
   git branch -M main
   
   # Push to GitHub
   git push -u origin main
   ```

## Option 3: Using SSH (if you have SSH keys set up)

```bash
cd /Users/emilyfehr8/CascadeProjects/vantus

# Add remote (replace YOUR_USERNAME)
git remote add origin git@github.com:YOUR_USERNAME/vantus-prototype.git

# Push
git branch -M main
git push -u origin main
```

## Verify

After pushing, verify your repository:
- Visit: `https://github.com/YOUR_USERNAME/vantus-prototype`
- You should see all three components (bridge-server, vantus-app, vantus-dashboard)
- README.md should be displayed on the main page

## Next Steps

Once on GitHub, you can:
- Add collaborators
- Set up GitHub Actions for CI/CD
- Create issues for features/bugs
- Add project description and topics
- Enable GitHub Pages (if needed)

## Repository Structure

Your repository contains:
```
vantus-prototype/
├── bridge-server/       # Socket.io bridge server
├── vantus-app/         # React Native mobile app
├── vantus-dashboard/   # Next.js tactical dashboard
├── .gitignore
└── README.md
```

All `node_modules` and build artifacts are excluded via `.gitignore`.

