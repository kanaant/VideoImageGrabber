![Video Image Grabber](public/banner.png)

# Video Image Grabber

A Next.js web application for extracting high-quality frames from videos. All video processing is done entirely client-side, ensuring privacy and speed.

## Features

- **Drag & Drop Upload**: Easily upload videos by dragging them into the interface.
- **Precision Control**: Navigate through videos frame-by-frame using keyboard arrows.
- **Visual Timeline**: Filmstrip of thumbnails for quick visual navigation.
- **Timeline Zoom**: When dragging the slider, thumbnails zoom to show a detailed view around your position.
- **Client-Side Processing**: No server interactions for video processing; everything happens in your browser.
- **PWA Support**: Installable as a Progressive Web App.
- **Modern UI**: Premium, mobile-friendly design.

## Getting Started

### Prerequisites

- Node.js (v18 or newer recommended)
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
   # or
   yarn install
   # or
   pnpm install
   ```

3. Run the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

   The application will start on [http://localhost:3033](http://localhost:3033).

## Docker Deployment

You can deploy the application using Docker.

1. Build and run the container:

   ```bash
   docker-compose up -d --build
   ```

   The service `VidImagaGrabber` will be available at port `3033`.

## Built With

- [Next.js](https://nextjs.org) - The React Framework
- [Lucide React](https://lucide.dev) - Icons
- [Tailwind CSS](https://tailwindcss.com) - Styling

## License

This project is open source and available under the [MIT License](LICENSE).
