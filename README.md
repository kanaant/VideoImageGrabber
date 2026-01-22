![Video Image Grabber](public/banner.png)

# Video Image Grabber

A Next.js web application for extracting high-quality frames from videos. All video processing is done entirely client-side, ensuring privacy and speed.

## Features

- **Drag & Drop Upload**: Easily upload videos by dragging them into the interface.
- **Precision Control**: Navigate through videos frame-by-frame using keyboard arrows.
- **Visual Timeline**: Filmstrip of thumbnails for quick visual navigation.
- **Timeline Zoom**: When dragging the slider, thumbnails zoom to show a detailed view around your position.
- **Full Offline Support**: Install as PWA and use even when the server is down.
- **Client-Side Processing**: No server interactions; everything happens in your browser.
- **Modern UI**: Premium, mobile-friendly design.

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
