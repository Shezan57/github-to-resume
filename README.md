# 🚀 GitHub Resume Generator

Transform your GitHub profile into a professional resume with the power of AI!

![GitHub Resume Generator](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-green?style=for-the-badge&logo=openai)

## ✨ Features

- **🔍 Smart Analysis** - AI reads your code, READMEs, and config files to understand your skills
- **⚡ Lightning Fast** - Generate a complete resume in under 2 minutes
- **🛡️ Privacy First** - Only reads public repositories, data never stored permanently
- **🎨 Multiple Templates** - Choose from Modern, Classic, Minimal, or Creative styles
- **📄 Export Options** - Download as PDF or DOCX
- **✏️ Inline Editing** - Click to edit any part of your resume
- **🤖 AI Enhancement** - Improve individual bullet points with AI suggestions
- **💯 Token Management** - Smart chunking handles even the largest codebases

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: OpenAI GPT-4o-mini
- **APIs**: GitHub REST API via Octokit

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/github-to-resume.git
   cd github-to-resume
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your-openai-api-key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open http://localhost:3000**

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | ✅ Yes | Your OpenAI API key for resume generation |
| `GITHUB_TOKEN` | ❌ No | GitHub personal access token (increases rate limit from 60 to 5000 req/hour) |

## 🎯 How It Works

1. **Enter GitHub Username** - Paste your profile URL or just your username
2. **AI Analysis** - Our system fetches your repositories and analyzes:
   - README files for project descriptions
   - `package.json`, `requirements.txt`, etc. for tech stack
   - Source code structure for complexity assessment
3. **Hierarchical Summarization** - Large repos are chunked and summarized to fit LLM context limits
4. **Resume Generation** - AI synthesizes all data into a professional resume
5. **Edit & Export** - Fine-tune the content and download in your preferred format

## 🏗️ Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/     # Main analysis endpoint
│   │   └── enhance/     # Bullet point enhancement
│   ├── analyze/         # Analysis progress page
│   ├── resume/[id]/     # Resume editor page
│   └── page.tsx         # Landing page
├── components/
│   ├── ui/              # Reusable UI components
│   ├── landing/         # Landing page sections
│   └── resume/          # Resume templates
├── lib/
│   ├── github/          # GitHub API client
│   ├── llm/             # OpenAI integration & prompts
│   ├── tokens.ts        # Token management & chunking
│   ├── orchestrator.ts  # Main analysis pipeline
│   └── storage.ts       # LocalStorage persistence
└── types/               # TypeScript definitions
```

## 💡 Key Technical Features

### Token Management
The app includes a sophisticated token management system that:
- Counts tokens accurately using GPT tokenizer
- Chunks large files intelligently (preserving code blocks and paragraphs)
- Uses hierarchical summarization for repos that exceed context limits
- Allocates token budgets across different content types

### Rate Limit Handling
- Tracks GitHub API rate limits in real-time
- Automatically waits when limits are low
- Supports both authenticated and unauthenticated modes

### Smart File Selection
- Prioritizes README, entry points, and config files
- Ignores `node_modules`, `dist`, etc.
- Limits file sizes to prevent waste

## 📊 Cost Estimation

Using GPT-4o-mini (as of 2024):
- **Per resume**: ~$0.03-0.05
- **20 repos analyzed**: ~100K input tokens, ~20K output tokens
- **Final synthesis**: ~30K input, ~2K output

## 🚧 Roadmap

- [ ] Add Classic, Minimal, and Creative templates
- [ ] DOCX export (currently PDF only)
- [ ] Database persistence (currently localStorage)
- [ ] GitHub OAuth for private repos
- [ ] Cover letter generation
- [ ] Multiple resume versions per user

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this for personal or commercial projects.

---

Made with ❤️ by developers, for developers.
