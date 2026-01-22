![Video Image Grabber](public/banner.png)

# Video Image Grabber

A Next.js web application for extracting high-quality frames from videos. All video processing is done entirely client-side, ensuring privacy and speed.

## Features

- **Drag & Drop Upload**: Easily upload videos by dragging them into the interface.
- **Precision Control**: Navigate through videos frame-by-frame using keyboard arrows.
- **Advanced Playback**: Control playback speed (0.25x - 2x) and toggle audio mute.
- **Video Adjustments**: Rotate (90° steps), Flip (H/V), and interactive Crop (drag/resize) before capturing.
- **WYSIWYG Capture**: Captured frames exactly match your video adjustments (Crop/Rotate/Flip).
- **Video Metadata**: View detailed video info (Resolution, Codec, Duration, Size).
- **Batch Review Mode**: Manage captured frames with Split-Screen Comparison and Carousel view.
- **Comparison View**: Smart auto-loading split view for side-by-side image inspection.
- **Export Options**: Save single frames as PNG/JPG/WEBP, or batch download all frames with format selection.
- **Visual Timeline**: Filmstrip of thumbnails for quick visual navigation with Zoom-on-Hover.
- **Full Offline Support**: Install as PWA and use even when the server is down.
- **Client-Side Processing**: No server interactions; everything happens in your browser.
- **Responsive Design**: Full-width layout that automatically fits video and images to your browser window.

## Getting Started

### Prerequisites

- Node.js (v20 or newer recommended)
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd VideoImageGrabber
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

   The application will start on [http://localhost:3000](http://localhost:3000).

### Production Build

For offline PWA support, run the production build:

```bash
npm run build
node .next/standalone/server.js
```

## Docker Deployment

Deploy with Docker Compose:

```bash
docker-compose up -d --build
```

The service will be available at port `3051` (mapped to internal port `3000`).

## Built With

- [Next.js](https://nextjs.org) - The React Framework
- [Lucide React](https://lucide.dev) - Icons

## License

This project is open source and available under the [MIT License](LICENSE).
