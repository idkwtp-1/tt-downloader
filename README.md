# TikTok Downloader

A modern React-based TikTok video downloader with HD and normal quality options.

## Features

- Download TikTok videos in HD or normal quality
- Modern, responsive UI with TikTok-inspired design
- Video preview with thumbnail and metadata
- Copy download links to clipboard
- No watermark option available

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Deployment

This project is configured for GitHub Pages deployment. The base path is set to `/tt-Downloader/`.

To deploy:
1. Push your code to GitHub
2. Enable GitHub Pages in repository settings
3. Select the `gh-pages` branch as the source

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Lucide React (icons)
- tikwm.com API

## API

This app uses the tikwm.com API to fetch TikTok video data. The API is free and supports CORS, making it suitable for client-side applications.
